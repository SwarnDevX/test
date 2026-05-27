// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test } from "forge-std/Test.sol";
import { TaskEscrow } from "../src/TaskEscrow.sol";
import { ReputationRegistry } from "../src/ReputationRegistry.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract TaskEscrowTest is Test {
    TaskEscrow public escrow;
    ReputationRegistry public repRegistry;
    MockERC20 public usdc;

    address public constant OWNER = address(0x0WNEE);
    address public constant POSTER = address(0xP0S7ER);
    address public constant AGENT_WALLET = address(0xA6EN7);

    uint256 constant AGENT_ID = 1;
    uint256 constant AMOUNT = 100e6; // 100 USDC
    bytes32 constant TASK_HASH = keccak256("Write a blog post");
    bytes32 constant RESULT_HASH = keccak256("ipfs://QmResult");

    function setUp() public {
        usdc = new MockERC20();
        escrow = new TaskEscrow(address(usdc), OWNER);
        repRegistry = new ReputationRegistry(address(escrow));

        vm.prank(OWNER);
        escrow.setReputationRegistry(address(repRegistry));

        // Fund poster with USDC and approve escrow
        usdc.mint(POSTER, 10_000e6);
        vm.prank(POSTER);
        usdc.approve(address(escrow), type(uint256).max);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    function test_constructor_setsImmutables() public view {
        assertEq(address(escrow.usdc()), address(usdc));
    }

    function test_constructor_revertsOnZeroUsdc() public {
        vm.expectRevert(TaskEscrow.ZeroAddress.selector);
        new TaskEscrow(address(0), OWNER);
    }

    function test_constructor_revertsOnZeroOwner() public {
        vm.expectRevert(TaskEscrow.ZeroAddress.selector);
        new TaskEscrow(address(usdc), address(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // setReputationRegistry()
    // ─────────────────────────────────────────────────────────────────────────

    function test_setReputationRegistry_revertsIfCalledTwice() public {
        vm.prank(OWNER);
        vm.expectRevert(TaskEscrow.ReputationRegistryAlreadySet.selector);
        escrow.setReputationRegistry(address(repRegistry));
    }

    function test_setReputationRegistry_revertsForNonOwner() public {
        TaskEscrow fresh = new TaskEscrow(address(usdc), OWNER);
        vm.prank(POSTER);
        vm.expectRevert();
        fresh.setReputationRegistry(address(repRegistry));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // createTask()
    // ─────────────────────────────────────────────────────────────────────────

    function test_createTask_success() public {
        uint256 balanceBefore = usdc.balanceOf(POSTER);

        vm.prank(POSTER);
        vm.expectEmit(true, true, false, true);
        emit TaskEscrow.TaskCreated(1, POSTER, TASK_HASH, AMOUNT);
        uint256 taskId = escrow.createTask(TASK_HASH, AMOUNT);

        assertEq(taskId, 1);
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT);
        assertEq(usdc.balanceOf(POSTER), balanceBefore - AMOUNT);

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(task.poster, POSTER);
        assertEq(task.amount, AMOUNT);
        assertEq(uint8(task.status), uint8(TaskEscrow.TaskStatus.Funded));
        assertGt(task.createdAt, 0);
    }

    function test_createTask_incrementsId() public {
        vm.startPrank(POSTER);
        uint256 id1 = escrow.createTask(TASK_HASH, AMOUNT);
        uint256 id2 = escrow.createTask(TASK_HASH, AMOUNT);
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(escrow.totalTasks(), 2);
    }

    function test_createTask_revertsOnZeroAmount() public {
        vm.prank(POSTER);
        vm.expectRevert(TaskEscrow.InsufficientAmount.selector);
        escrow.createTask(TASK_HASH, 0);
    }

    function test_createTask_revertsWhenPaused() public {
        vm.prank(OWNER);
        escrow.pause();

        vm.prank(POSTER);
        vm.expectRevert();
        escrow.createTask(TASK_HASH, AMOUNT);
    }

    function test_createTask_worksAfterUnpause() public {
        vm.prank(OWNER);
        escrow.pause();
        vm.prank(OWNER);
        escrow.unpause();

        vm.prank(POSTER);
        uint256 id = escrow.createTask(TASK_HASH, AMOUNT);
        assertEq(id, 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // assignAgent()
    // ─────────────────────────────────────────────────────────────────────────

    function _createFundedTask() internal returns (uint256 taskId) {
        vm.prank(POSTER);
        taskId = escrow.createTask(TASK_HASH, AMOUNT);
    }

    function test_assignAgent_success() public {
        uint256 taskId = _createFundedTask();

        vm.prank(POSTER);
        vm.expectEmit(true, true, false, true);
        emit TaskEscrow.AgentAssigned(taskId, AGENT_ID, AGENT_WALLET);
        escrow.assignAgent(taskId, AGENT_ID, AGENT_WALLET);

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint8(task.status), uint8(TaskEscrow.TaskStatus.Assigned));
        assertEq(task.agentWallet, AGENT_WALLET);
        assertEq(task.agentId, AGENT_ID);
        assertGt(task.assignedAt, 0);
    }

    function test_assignAgent_revertsIfNotPoster() public {
        uint256 taskId = _createFundedTask();

        vm.prank(address(0xBAD));
        vm.expectRevert(
            abi.encodeWithSelector(TaskEscrow.NotTaskPoster.selector, taskId, address(0xBAD))
        );
        escrow.assignAgent(taskId, AGENT_ID, AGENT_WALLET);
    }

    function test_assignAgent_revertsIfWrongStatus() public {
        uint256 taskId = _createFundedTask();
        vm.prank(POSTER);
        escrow.assignAgent(taskId, AGENT_ID, AGENT_WALLET);

        // Now Assigned — cannot assign again
        vm.prank(POSTER);
        vm.expectRevert(
            abi.encodeWithSelector(
                TaskEscrow.WrongStatus.selector,
                taskId,
                TaskEscrow.TaskStatus.Funded,
                TaskEscrow.TaskStatus.Assigned
            )
        );
        escrow.assignAgent(taskId, AGENT_ID, AGENT_WALLET);
    }

    function test_assignAgent_revertsOnZeroAgentWallet() public {
        uint256 taskId = _createFundedTask();

        vm.prank(POSTER);
        vm.expectRevert(TaskEscrow.ZeroAddress.selector);
        escrow.assignAgent(taskId, AGENT_ID, address(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // submitWork()
    // ─────────────────────────────────────────────────────────────────────────

    function _createAssignedTask() internal returns (uint256 taskId) {
        taskId = _createFundedTask();
        vm.prank(POSTER);
        escrow.assignAgent(taskId, AGENT_ID, AGENT_WALLET);
    }

    function test_submitWork_success() public {
        uint256 taskId = _createAssignedTask();

        vm.prank(AGENT_WALLET);
        vm.expectEmit(true, false, false, true);
        emit TaskEscrow.WorkSubmitted(taskId, RESULT_HASH);
        escrow.submitWork(taskId, RESULT_HASH);

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint8(task.status), uint8(TaskEscrow.TaskStatus.Submitted));
        assertEq(task.resultHash, RESULT_HASH);
        assertGt(task.submittedAt, 0);
    }

    function test_submitWork_revertsIfNotAgent() public {
        uint256 taskId = _createAssignedTask();

        vm.prank(POSTER);
        vm.expectRevert(
            abi.encodeWithSelector(TaskEscrow.NotAssignedAgent.selector, taskId, POSTER)
        );
        escrow.submitWork(taskId, RESULT_HASH);
    }

    function test_submitWork_revertsIfWrongStatus() public {
        uint256 taskId = _createFundedTask();

        vm.prank(AGENT_WALLET);
        vm.expectRevert(
            abi.encodeWithSelector(
                TaskEscrow.WrongStatus.selector,
                taskId,
                TaskEscrow.TaskStatus.Assigned,
                TaskEscrow.TaskStatus.Funded
            )
        );
        escrow.submitWork(taskId, RESULT_HASH);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // acceptWork()
    // ─────────────────────────────────────────────────────────────────────────

    function _createSubmittedTask() internal returns (uint256 taskId) {
        taskId = _createAssignedTask();
        vm.prank(AGENT_WALLET);
        escrow.submitWork(taskId, RESULT_HASH);
    }

    function test_acceptWork_releasesUSDC() public {
        uint256 taskId = _createSubmittedTask();
        uint256 agentBefore = usdc.balanceOf(AGENT_WALLET);

        vm.prank(POSTER);
        vm.expectEmit(true, true, true, true);
        emit TaskEscrow.WorkAccepted(taskId, POSTER, AGENT_WALLET, AMOUNT);
        escrow.acceptWork(taskId, 5, RESULT_HASH);

        assertEq(usdc.balanceOf(AGENT_WALLET), agentBefore + AMOUNT);
        assertEq(usdc.balanceOf(address(escrow)), 0);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Released));
    }

    function test_acceptWork_writesReputation() public {
        uint256 taskId = _createSubmittedTask();

        vm.prank(POSTER);
        escrow.acceptWork(taskId, 4, RESULT_HASH);

        ReputationRegistry.Review[] memory reviews = repRegistry.getReviews(AGENT_ID);
        assertEq(reviews.length, 1);
        assertEq(reviews[0].rating, 4);
        assertEq(reviews[0].reviewer, POSTER);
    }

    function test_acceptWork_revertsOnInvalidRating() public {
        uint256 taskId = _createSubmittedTask();

        vm.prank(POSTER);
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.InvalidRating.selector, 0));
        escrow.acceptWork(taskId, 0, RESULT_HASH);
    }

    function test_acceptWork_revertsIfNotPoster() public {
        uint256 taskId = _createSubmittedTask();

        vm.prank(AGENT_WALLET);
        vm.expectRevert(
            abi.encodeWithSelector(TaskEscrow.NotTaskPoster.selector, taskId, AGENT_WALLET)
        );
        escrow.acceptWork(taskId, 5, RESULT_HASH);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // dispute()
    // ─────────────────────────────────────────────────────────────────────────

    function test_dispute_success() public {
        uint256 taskId = _createSubmittedTask();

        vm.prank(POSTER);
        vm.expectEmit(true, true, false, false);
        emit TaskEscrow.TaskDisputed(taskId, POSTER);
        escrow.dispute(taskId);

        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Disputed));
    }

    function test_dispute_revertsIfNotSubmitted() public {
        uint256 taskId = _createAssignedTask();

        vm.prank(POSTER);
        vm.expectRevert(
            abi.encodeWithSelector(
                TaskEscrow.WrongStatus.selector,
                taskId,
                TaskEscrow.TaskStatus.Submitted,
                TaskEscrow.TaskStatus.Assigned
            )
        );
        escrow.dispute(taskId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // resolveDispute()
    // ─────────────────────────────────────────────────────────────────────────

    function _createDisputedTask() internal returns (uint256 taskId) {
        taskId = _createSubmittedTask();
        vm.prank(POSTER);
        escrow.dispute(taskId);
    }

    function test_resolveDispute_releaseToAgent() public {
        uint256 taskId = _createDisputedTask();
        uint256 agentBefore = usdc.balanceOf(AGENT_WALLET);

        vm.prank(OWNER);
        vm.expectEmit(true, true, false, true);
        emit TaskEscrow.DisputeResolved(taskId, AGENT_WALLET, AMOUNT);
        escrow.resolveDispute(taskId, true);

        assertEq(usdc.balanceOf(AGENT_WALLET), agentBefore + AMOUNT);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Released));
    }

    function test_resolveDispute_refundToPoster() public {
        uint256 taskId = _createDisputedTask();
        uint256 posterBefore = usdc.balanceOf(POSTER);

        vm.prank(OWNER);
        vm.expectEmit(true, true, false, true);
        emit TaskEscrow.DisputeResolved(taskId, POSTER, AMOUNT);
        escrow.resolveDispute(taskId, false);

        assertEq(usdc.balanceOf(POSTER), posterBefore + AMOUNT);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Refunded));
    }

    function test_resolveDispute_revertsForNonOwner() public {
        uint256 taskId = _createDisputedTask();

        vm.prank(POSTER);
        vm.expectRevert();
        escrow.resolveDispute(taskId, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // refundTask()
    // ─────────────────────────────────────────────────────────────────────────

    function test_refundTask_success() public {
        uint256 taskId = _createFundedTask();
        uint256 posterBefore = usdc.balanceOf(POSTER);

        vm.prank(POSTER);
        vm.expectEmit(true, true, false, true);
        emit TaskEscrow.TaskRefunded(taskId, POSTER, AMOUNT);
        escrow.refundTask(taskId);

        assertEq(usdc.balanceOf(POSTER), posterBefore + AMOUNT);
        assertEq(usdc.balanceOf(address(escrow)), 0);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Refunded));
    }

    function test_refundTask_revertsAfterAssignment() public {
        uint256 taskId = _createAssignedTask();

        vm.prank(POSTER);
        vm.expectRevert(
            abi.encodeWithSelector(
                TaskEscrow.WrongStatus.selector,
                taskId,
                TaskEscrow.TaskStatus.Funded,
                TaskEscrow.TaskStatus.Assigned
            )
        );
        escrow.refundTask(taskId);
    }

    function test_refundTask_revertsIfNotPoster() public {
        uint256 taskId = _createFundedTask();

        vm.prank(address(0xBAD));
        vm.expectRevert(
            abi.encodeWithSelector(
                TaskEscrow.NotTaskPoster.selector, taskId, address(0xBAD)
            )
        );
        escrow.refundTask(taskId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getTask() / getPosterTasks()
    // ─────────────────────────────────────────────────────────────────────────

    function test_getTask_revertsForNonExistent() public {
        vm.expectRevert(abi.encodeWithSelector(TaskEscrow.TaskNotFound.selector, 999));
        escrow.getTask(999);
    }

    function test_getPosterTasks_returnsAllIds() public {
        vm.startPrank(POSTER);
        escrow.createTask(TASK_HASH, AMOUNT);
        escrow.createTask(TASK_HASH, AMOUNT);
        vm.stopPrank();

        uint256[] memory ids = escrow.getPosterTasks(POSTER);
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fuzz tests
    // ─────────────────────────────────────────────────────────────────────────

    function testFuzz_createTask_zeroAmountReverts(uint256 amount) public {
        vm.assume(amount == 0);
        vm.prank(POSTER);
        vm.expectRevert(TaskEscrow.InsufficientAmount.selector);
        escrow.createTask(TASK_HASH, amount);
    }

    function testFuzz_createTask_nonZeroSucceeds(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 10_000e6);
        usdc.mint(POSTER, amount);

        vm.prank(POSTER);
        uint256 taskId = escrow.createTask(TASK_HASH, amount);

        assertEq(usdc.balanceOf(address(escrow)), amount);
        assertEq(escrow.getTask(taskId).amount, amount);
    }

    function testFuzz_fullLifecycle_happyPath(uint256 amount, uint8 rating) public {
        amount = bound(amount, 1e6, 10_000e6); // 1 to 10_000 USDC
        rating = uint8(bound(uint256(rating), 1, 5));

        usdc.mint(POSTER, amount);
        vm.prank(POSTER);
        uint256 taskId = escrow.createTask(TASK_HASH, amount);

        vm.prank(POSTER);
        escrow.assignAgent(taskId, AGENT_ID, AGENT_WALLET);

        vm.prank(AGENT_WALLET);
        escrow.submitWork(taskId, RESULT_HASH);

        uint256 agentBefore = usdc.balanceOf(AGENT_WALLET);
        vm.prank(POSTER);
        escrow.acceptWork(taskId, rating, RESULT_HASH);

        assertEq(usdc.balanceOf(AGENT_WALLET), agentBefore + amount);
        assertEq(uint8(escrow.getTask(taskId).status), uint8(TaskEscrow.TaskStatus.Released));

        (uint256 avg,) = repRegistry.getReputationScore(AGENT_ID);
        assertEq(avg, uint256(rating) * 100);
    }

    function testFuzz_dispute_resolveToEitherParty(bool releaseToAgent) public {
        uint256 taskId = _createSubmittedTask();
        vm.prank(POSTER);
        escrow.dispute(taskId);

        uint256 agentBefore = usdc.balanceOf(AGENT_WALLET);
        uint256 posterBefore = usdc.balanceOf(POSTER);

        vm.prank(OWNER);
        escrow.resolveDispute(taskId, releaseToAgent);

        if (releaseToAgent) {
            assertEq(usdc.balanceOf(AGENT_WALLET), agentBefore + AMOUNT);
        } else {
            assertEq(usdc.balanceOf(POSTER), posterBefore + AMOUNT);
        }
    }
}
