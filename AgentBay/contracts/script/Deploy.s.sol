// SPDX-License-Identifier: MIT
// Targets: OpenZeppelin Contracts v5.3.0, Solidity 0.8.24, Foundry Script
pragma solidity 0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { AgentRegistry } from "../src/AgentRegistry.sol";
import { ReputationRegistry } from "../src/ReputationRegistry.sol";
import { TaskEscrow } from "../src/TaskEscrow.sol";

/// @notice Deploys AgentRegistry, TaskEscrow, and ReputationRegistry to the target chain.
///
/// @dev Deployment order matters because of the circular dependency:
///   1. AgentRegistry   — no dependencies
///   2. TaskEscrow      — needs USDC address + owner (no ReputationRegistry yet)
///   3. ReputationRegistry — needs TaskEscrow address
///   4. taskEscrow.setReputationRegistry() — one-time wire-up
///
/// Usage (Base Sepolia):
///   forge script script/Deploy.s.sol \
///     --rpc-url $BASE_SEPOLIA_RPC_URL \
///     --private-key $OPERATOR_PRIVATE_KEY \
///     --broadcast \
///     --verify \
///     --chain base-sepolia
///
/// Usage (Base Mainnet):
///   forge script script/Deploy.s.sol \
///     --rpc-url $BASE_MAINNET_RPC_URL \
///     --private-key $OPERATOR_PRIVATE_KEY \
///     --broadcast \
///     --verify \
///     --chain base
contract Deploy is Script {
    // ─── USDC addresses ──────────────────────────────────────────────────────

    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // Chain IDs
    uint256 constant CHAIN_BASE_SEPOLIA = 84532;
    uint256 constant CHAIN_BASE_MAINNET = 8453;

    // ─────────────────────────────────────────────────────────────────────────

    function run() external {
        address usdc = _resolveUsdc();
        address deployer = msg.sender;

        console2.log("=== AgentBay Deployment ===");
        console2.log("Chain ID:  ", block.chainid);
        console2.log("Deployer:  ", deployer);
        console2.log("USDC:      ", usdc);
        console2.log("");

        vm.startBroadcast();

        // 1. AgentRegistry — no constructor dependencies
        AgentRegistry agentRegistry = new AgentRegistry();
        console2.log("AgentRegistry:      ", address(agentRegistry));

        // 2. TaskEscrow — no reputation registry yet; gracefully skips reputation writes
        //    until setReputationRegistry() is called in step 4
        TaskEscrow taskEscrow = new TaskEscrow(usdc, deployer);
        console2.log("TaskEscrow:         ", address(taskEscrow));

        // 3. ReputationRegistry — points back at TaskEscrow
        ReputationRegistry reputationRegistry = new ReputationRegistry(address(taskEscrow));
        console2.log("ReputationRegistry: ", address(reputationRegistry));

        // 4. Wire up — one-time setter; TaskEscrow now writes reviews on acceptWork()
        taskEscrow.setReputationRegistry(address(reputationRegistry));
        console2.log("");
        console2.log("setReputationRegistry() called — contracts are fully wired.");

        vm.stopBroadcast();

        console2.log("");
        console2.log("=== Copy these into your .env ===");
        console2.log("CONTRACT_AGENT_REGISTRY_ADDRESS=", address(agentRegistry));
        console2.log("CONTRACT_TASK_ESCROW_ADDRESS=", address(taskEscrow));
        console2.log("CONTRACT_REPUTATION_REGISTRY_ADDRESS=", address(reputationRegistry));
    }

    function _resolveUsdc() internal view returns (address) {
        uint256 chainId = block.chainid;
        if (chainId == CHAIN_BASE_SEPOLIA) return USDC_BASE_SEPOLIA;
        if (chainId == CHAIN_BASE_MAINNET) return USDC_BASE_MAINNET;

        // Local Anvil fork — read USDC_ADDRESS from env so the caller can inject a mock
        return vm.envAddress("USDC_ADDRESS");
    }
}
