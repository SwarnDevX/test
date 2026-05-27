// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { ReputationRegistry } from "../src/ReputationRegistry.sol";

contract ReputationRegistryTest is Test {
    ReputationRegistry public registry;

    address public constant TASK_ESCROW = address(0xE5CR0W);
    address public constant REVIEWER = address(0xBEEF);

    uint256 constant AGENT_ID = 1;
    uint256 constant TASK_ID = 100;
    uint8 constant RATING = 5;
    bytes32 constant HASH = keccak256("great work");

    function setUp() public {
        registry = new ReputationRegistry(TASK_ESCROW);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    function test_constructor_storesTaskEscrow() public view {
        assertEq(registry.taskEscrow(), TASK_ESCROW);
    }

    function test_constructor_revertsOnZeroAddress() public {
        vm.expectRevert(ReputationRegistry.ZeroAddress.selector);
        new ReputationRegistry(address(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // addReview()
    // ─────────────────────────────────────────────────────────────────────────

    function test_addReview_success() public {
        vm.prank(TASK_ESCROW);
        registry.addReview(AGENT_ID, TASK_ID, RATING, HASH, REVIEWER);

        ReputationRegistry.Review[] memory reviews = registry.getReviews(AGENT_ID);
        assertEq(reviews.length, 1);
        assertEq(reviews[0].agentId, AGENT_ID);
        assertEq(reviews[0].taskId, TASK_ID);
        assertEq(reviews[0].rating, RATING);
        assertEq(reviews[0].hashOfReview, HASH);
        assertEq(reviews[0].reviewer, REVIEWER);
        assertGt(reviews[0].timestamp, 0);
    }

    function test_addReview_emitsEvent() public {
        vm.prank(TASK_ESCROW);
        vm.expectEmit(true, true, true, true);
        emit ReputationRegistry.ReviewAdded(AGENT_ID, TASK_ID, RATING, HASH, REVIEWER);
        registry.addReview(AGENT_ID, TASK_ID, RATING, HASH, REVIEWER);
    }

    function test_addReview_marksTaskAsReviewed() public {
        assertFalse(registry.isTaskReviewed(TASK_ID));

        vm.prank(TASK_ESCROW);
        registry.addReview(AGENT_ID, TASK_ID, RATING, HASH, REVIEWER);

        assertTrue(registry.isTaskReviewed(TASK_ID));
    }

    function test_addReview_revertsFromNonTaskEscrow() public {
        vm.prank(REVIEWER);
        vm.expectRevert(
            abi.encodeWithSelector(ReputationRegistry.OnlyTaskEscrow.selector, REVIEWER)
        );
        registry.addReview(AGENT_ID, TASK_ID, RATING, HASH, REVIEWER);
    }

    function test_addReview_revertsOnDuplicateTask() public {
        vm.startPrank(TASK_ESCROW);
        registry.addReview(AGENT_ID, TASK_ID, RATING, HASH, REVIEWER);

        vm.expectRevert(
            abi.encodeWithSelector(ReputationRegistry.TaskAlreadyReviewed.selector, TASK_ID)
        );
        registry.addReview(AGENT_ID, TASK_ID, 3, HASH, REVIEWER);
        vm.stopPrank();
    }

    function test_addReview_revertsOnZeroRating() public {
        vm.prank(TASK_ESCROW);
        vm.expectRevert(abi.encodeWithSelector(ReputationRegistry.InvalidRating.selector, 0));
        registry.addReview(AGENT_ID, TASK_ID, 0, HASH, REVIEWER);
    }

    function test_addReview_revertsOnRatingAboveFive() public {
        vm.prank(TASK_ESCROW);
        vm.expectRevert(abi.encodeWithSelector(ReputationRegistry.InvalidRating.selector, 6));
        registry.addReview(AGENT_ID, TASK_ID, 6, HASH, REVIEWER);
    }

    function test_addReview_ratingOneIsValid() public {
        vm.prank(TASK_ESCROW);
        registry.addReview(AGENT_ID, TASK_ID, 1, HASH, REVIEWER);
        assertEq(registry.getReviews(AGENT_ID)[0].rating, 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getReputationScore()
    // ─────────────────────────────────────────────────────────────────────────

    function test_reputationScore_emptyAgent() public view {
        (uint256 average, uint256 count) = registry.getReputationScore(999);
        assertEq(average, 0);
        assertEq(count, 0);
    }

    function test_reputationScore_singleReview() public {
        vm.prank(TASK_ESCROW);
        registry.addReview(AGENT_ID, TASK_ID, 4, HASH, REVIEWER);

        (uint256 average, uint256 count) = registry.getReputationScore(AGENT_ID);
        assertEq(average, 400); // 4.00 × 100
        assertEq(count, 1);
    }

    function test_reputationScore_multipleReviews() public {
        vm.startPrank(TASK_ESCROW);
        registry.addReview(AGENT_ID, 1, 5, HASH, REVIEWER); // 5
        registry.addReview(AGENT_ID, 2, 3, HASH, REVIEWER); // 3
        registry.addReview(AGENT_ID, 3, 4, HASH, REVIEWER); // 4
        vm.stopPrank();

        // avg = (5+3+4)/3 = 12/3 = 4.00
        (uint256 average, uint256 count) = registry.getReputationScore(AGENT_ID);
        assertEq(average, 400);
        assertEq(count, 3);
    }

    function test_reputationScore_perfectScore() public {
        vm.startPrank(TASK_ESCROW);
        registry.addReview(AGENT_ID, 1, 5, HASH, REVIEWER);
        registry.addReview(AGENT_ID, 2, 5, HASH, REVIEWER);
        vm.stopPrank();

        (uint256 average, uint256 count) = registry.getReputationScore(AGENT_ID);
        assertEq(average, 500); // 5.00 × 100
        assertEq(count, 2);
    }

    function test_multipleAgentsHaveIndependentScores() public {
        vm.startPrank(TASK_ESCROW);
        registry.addReview(1, 10, 5, HASH, REVIEWER);
        registry.addReview(2, 11, 1, HASH, REVIEWER);
        vm.stopPrank();

        (uint256 avg1,) = registry.getReputationScore(1);
        (uint256 avg2,) = registry.getReputationScore(2);

        assertEq(avg1, 500);
        assertEq(avg2, 100);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fuzz tests
    // ─────────────────────────────────────────────────────────────────────────

    function testFuzz_addReview_validRating(uint8 rating) public {
        vm.assume(rating >= 1 && rating <= 5);

        vm.prank(TASK_ESCROW);
        registry.addReview(AGENT_ID, TASK_ID, rating, HASH, REVIEWER);

        assertEq(registry.getReviews(AGENT_ID)[0].rating, rating);
    }

    function testFuzz_addReview_invalidRating(uint8 rating) public {
        vm.assume(rating == 0 || rating > 5);

        vm.prank(TASK_ESCROW);
        vm.expectRevert(
            abi.encodeWithSelector(ReputationRegistry.InvalidRating.selector, rating)
        );
        registry.addReview(AGENT_ID, TASK_ID, rating, HASH, REVIEWER);
    }

    function testFuzz_reputationScore_averageNeverExceedsFiveHundred(
        uint8[] calldata ratings
    ) public {
        vm.assume(ratings.length > 0 && ratings.length <= 50);

        uint256 validCount = 0;
        vm.startPrank(TASK_ESCROW);
        for (uint256 i = 0; i < ratings.length; i++) {
            if (ratings[i] >= 1 && ratings[i] <= 5) {
                registry.addReview(AGENT_ID, i + 1, ratings[i], HASH, REVIEWER);
                validCount++;
            }
        }
        vm.stopPrank();

        if (validCount > 0) {
            (uint256 average,) = registry.getReputationScore(AGENT_ID);
            assertLe(average, 500);
            assertGe(average, 100);
        }
    }
}
