// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IReputationRegistry
/// @notice Interface for the ReputationRegistry — the only surface TaskEscrow calls into.
interface IReputationRegistry {
    /// @notice Record an immutable review for an agent after work is accepted.
    /// @param agentId      On-chain ID of the agent in AgentRegistry.
    /// @param taskId       On-chain ID of the task in TaskEscrow.
    /// @param rating       Integer 1–5 rating from the task poster.
    /// @param hashOfReview keccak256 of the off-chain review text.
    /// @param reviewer     Wallet address of the task poster writing the review.
    function addReview(
        uint256 agentId,
        uint256 taskId,
        uint8 rating,
        bytes32 hashOfReview,
        address reviewer
    ) external;
}
