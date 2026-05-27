// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Test, console2 } from "forge-std/Test.sol";
import { AgentRegistry } from "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;

    address public constant ALICE = address(0xA11CE);
    address public constant BOB = address(0xB0B);

    string constant URI = "ipfs://QmAgentMetadata";
    string[] internal CAPS_EMPTY;
    string[] internal CAPS_TWO;

    function setUp() public {
        registry = new AgentRegistry();
        CAPS_TWO.push("research");
        CAPS_TWO.push("summarize");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // register()
    // ─────────────────────────────────────────────────────────────────────────

    function test_register_returnsIncrementingId() public {
        vm.prank(ALICE);
        uint256 id1 = registry.register(URI, CAPS_TWO);
        vm.prank(BOB);
        uint256 id2 = registry.register(URI, CAPS_EMPTY);

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(registry.totalAgents(), 2);
    }

    function test_register_storesCorrectData() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_TWO);

        AgentRegistry.Agent memory agent = registry.getAgent(id);

        assertEq(agent.owner, ALICE);
        assertEq(agent.metadataURI, URI);
        assertEq(agent.capabilities.length, 2);
        assertEq(agent.capabilities[0], "research");
        assertTrue(agent.active);
        assertGt(agent.registeredAt, 0);
    }

    function test_register_emitsEvent() public {
        vm.prank(ALICE);
        vm.expectEmit(true, true, false, true);
        emit AgentRegistry.AgentRegistered(1, ALICE, URI);
        registry.register(URI, CAPS_EMPTY);
    }

    function test_register_revertsOnEmptyURI() public {
        vm.prank(ALICE);
        vm.expectRevert(AgentRegistry.EmptyMetadataURI.selector);
        registry.register("", CAPS_EMPTY);
    }

    function test_register_tracksOwnerAgents() public {
        vm.startPrank(ALICE);
        registry.register(URI, CAPS_EMPTY);
        registry.register(URI, CAPS_EMPTY);
        vm.stopPrank();

        uint256[] memory ids = registry.getAgentsByOwner(ALICE);
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // update()
    // ─────────────────────────────────────────────────────────────────────────

    function test_update_success() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);

        string memory newURI = "ipfs://QmUpdated";
        string[] memory newCaps = new string[](1);
        newCaps[0] = "code_review";

        vm.prank(ALICE);
        registry.update(id, newURI, newCaps);

        AgentRegistry.Agent memory agent = registry.getAgent(id);
        assertEq(agent.metadataURI, newURI);
        assertEq(agent.capabilities[0], "code_review");
    }

    function test_update_emitsEvent() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);

        string[] memory newCaps = new string[](1);
        newCaps[0] = "x";

        vm.prank(ALICE);
        vm.expectEmit(true, false, false, false);
        emit AgentRegistry.AgentUpdated(id, "ipfs://new", newCaps);
        registry.update(id, "ipfs://new", newCaps);
    }

    function test_update_revertsIfNotOwner() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);

        vm.prank(BOB);
        vm.expectRevert(abi.encodeWithSelector(AgentRegistry.NotAgentOwner.selector, id, BOB));
        registry.update(id, "ipfs://other", CAPS_EMPTY);
    }

    function test_update_revertsOnEmptyURI() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);

        vm.prank(ALICE);
        vm.expectRevert(AgentRegistry.EmptyMetadataURI.selector);
        registry.update(id, "", CAPS_EMPTY);
    }

    function test_update_revertsForNonExistentAgent() public {
        vm.prank(ALICE);
        vm.expectRevert(abi.encodeWithSelector(AgentRegistry.AgentNotFound.selector, 999));
        registry.update(999, URI, CAPS_EMPTY);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // deactivate() / reactivate()
    // ─────────────────────────────────────────────────────────────────────────

    function test_deactivate_success() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);

        vm.prank(ALICE);
        vm.expectEmit(true, false, false, false);
        emit AgentRegistry.AgentDeactivated(id);
        registry.deactivate(id);

        assertFalse(registry.getAgent(id).active);
    }

    function test_deactivate_revertsIfAlreadyInactive() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);
        vm.prank(ALICE);
        registry.deactivate(id);

        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(AgentRegistry.AgentAlreadyInactive.selector, id)
        );
        registry.deactivate(id);
    }

    function test_reactivate_success() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);
        vm.prank(ALICE);
        registry.deactivate(id);

        vm.prank(ALICE);
        vm.expectEmit(true, false, false, false);
        emit AgentRegistry.AgentReactivated(id);
        registry.reactivate(id);

        assertTrue(registry.getAgent(id).active);
    }

    function test_reactivate_revertsIfAlreadyActive() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);

        vm.prank(ALICE);
        vm.expectRevert(abi.encodeWithSelector(AgentRegistry.AgentAlreadyActive.selector, id));
        registry.reactivate(id);
    }

    function test_deactivate_revertsIfNotOwner() public {
        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);

        vm.prank(BOB);
        vm.expectRevert(abi.encodeWithSelector(AgentRegistry.NotAgentOwner.selector, id, BOB));
        registry.deactivate(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getAgent()
    // ─────────────────────────────────────────────────────────────────────────

    function test_getAgent_revertsForNonExistent() public {
        vm.expectRevert(abi.encodeWithSelector(AgentRegistry.AgentNotFound.selector, 42));
        registry.getAgent(42);
    }

    function test_getAgent_revertsForZeroId() public {
        vm.expectRevert(abi.encodeWithSelector(AgentRegistry.AgentNotFound.selector, 0));
        registry.getAgent(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fuzz tests
    // ─────────────────────────────────────────────────────────────────────────

    function testFuzz_register_idAlwaysIncrements(uint8 numAgents) public {
        vm.assume(numAgents > 0 && numAgents <= 20);

        for (uint256 i = 0; i < numAgents; i++) {
            address owner = address(uint160(i + 1));
            vm.prank(owner);
            uint256 id = registry.register(URI, CAPS_EMPTY);
            assertEq(id, i + 1);
        }
        assertEq(registry.totalAgents(), numAgents);
    }

    function testFuzz_update_onlyOwnerCanUpdate(address attacker) public {
        vm.assume(attacker != ALICE && attacker != address(0));

        vm.prank(ALICE);
        uint256 id = registry.register(URI, CAPS_EMPTY);

        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(AgentRegistry.NotAgentOwner.selector, id, attacker)
        );
        registry.update(id, "ipfs://attack", CAPS_EMPTY);
    }
}
