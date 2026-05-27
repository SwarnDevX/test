// SPDX-License-Identifier: MIT
// Targets: OpenZeppelin Contracts v5.3.0, Solidity 0.8.24
pragma solidity 0.8.24;

import { IReputationRegistry } from "./interfaces/IReputationRegistry.sol";

/// @title ReputationRegistry
/// @notice Immutable, append-only on-chain reputation ledger for AgentBay agents.
///         Only the authorised TaskEscrow contract may write review records.
///         All records are permanent — no updates, no deletions.
/// @dev    Rating scale: 1 (worst) to 5 (best).
///         `getReputationScore` returns the average scaled by 100 to preserve two decimal
///         places without floating-point (e.g., 450 == 4.50 stars).
contract ReputationRegistry is IReputationRegistry {
    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    struct Review {
        uint256 agentId;
        uint256 taskId;
        uint8 rating;           // 1–5
        bytes32 hashOfReview;   // keccak256 of off-chain review text
        address reviewer;       // wallet of the task poster
        uint256 timestamp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public immutable taskEscrow;
    mapping(uint256 => Review[]) private _reviews;       // agentId  => reviews
    mapping(uint256 => bool) private _taskReviewed;      // taskId   => reviewed already

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event ReviewAdded(
        uint256 indexed agentId,
        uint256 indexed taskId,
        uint8 rating,
        bytes32 hashOfReview,
        address indexed reviewer
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error OnlyTaskEscrow(address caller);
    error TaskAlreadyReviewed(uint256 taskId);
    error InvalidRating(uint8 rating);
    error ZeroAddress();

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @param taskEscrow_ Address of the deployed TaskEscrow — the only authorised writer.
    constructor(address taskEscrow_) {
        if (taskEscrow_ == address(0)) revert ZeroAddress();
        taskEscrow = taskEscrow_;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Write functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IReputationRegistry
    /// @dev Called by TaskEscrow.acceptWork() immediately before releasing escrow.
    function addReview(
        uint256 agentId,
        uint256 taskId,
        uint8 rating,
        bytes32 hashOfReview,
        address reviewer
    ) external override {
        if (msg.sender != taskEscrow) revert OnlyTaskEscrow(msg.sender);
        if (_taskReviewed[taskId]) revert TaskAlreadyReviewed(taskId);
        if (rating == 0 || rating > 5) revert InvalidRating(rating);

        _taskReviewed[taskId] = true;
        _reviews[agentId].push(
            Review({
                agentId: agentId,
                taskId: taskId,
                rating: rating,
                hashOfReview: hashOfReview,
                reviewer: reviewer,
                timestamp: block.timestamp
            })
        );

        emit ReviewAdded(agentId, taskId, rating, hashOfReview, reviewer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Return all reviews for a given agent, oldest first.
    function getReviews(uint256 agentId) external view returns (Review[] memory) {
        return _reviews[agentId];
    }

    /// @notice Compute the agent's average rating (scaled ×100) and total review count.
    /// @return average Rating average × 100 (e.g., 450 == 4.50 stars). 0 if no reviews.
    /// @return count   Total number of reviews.
    function getReputationScore(uint256 agentId)
        external
        view
        returns (uint256 average, uint256 count)
    {
        Review[] storage reviews = _reviews[agentId];
        count = reviews.length;
        if (count == 0) return (0, 0);

        uint256 sum = 0;
        for (uint256 i = 0; i < count; i++) {
            sum += reviews[i].rating;
        }
        average = (sum * 100) / count;
    }

    /// @notice Check whether a specific task has already been reviewed.
    function isTaskReviewed(uint256 taskId) external view returns (bool) {
        return _taskReviewed[taskId];
    }
}
