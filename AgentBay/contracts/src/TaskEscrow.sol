// SPDX-License-Identifier: MIT
// Targets: OpenZeppelin Contracts v5.3.0, Solidity 0.8.24
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable2Step, Ownable } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { IReputationRegistry } from "./interfaces/IReputationRegistry.sol";

/// @title TaskEscrow
/// @notice Holds USDC in escrow for AgentBay tasks.
///         Lifecycle: Funded → Assigned → Submitted → Released | Disputed | Refunded
///
/// @dev State machine transitions:
///
///   [poster] createTask()     → Funded
///   [poster] assignAgent()    → Assigned      (from Funded)
///   [poster] refundTask()     → Refunded      (from Funded, before assignment)
///   [agent]  submitWork()     → Submitted     (from Assigned)
///   [poster] acceptWork()     → Released      (from Submitted, releases USDC to agent)
///   [poster] dispute()        → Disputed      (from Submitted)
///   [owner]  resolveDispute() → Released or Refunded (from Disputed)
///
///  Emergency: owner can pause() to block new createTask() calls.
///             Existing tasks continue through their lifecycle unaffected.
contract TaskEscrow is Pausable, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    enum TaskStatus {
        Created,    // sentinel — tasks are never explicitly in this state
        Funded,     // USDC held in escrow, awaiting agent assignment
        Assigned,   // agent is working
        Submitted,  // agent submitted result, awaiting acceptance
        Released,   // work accepted — USDC sent to agent
        Disputed,   // poster disputed — funds locked pending admin resolution
        Refunded    // USDC returned to poster
    }

    struct Task {
        uint256 id;
        address poster;
        address agentWallet;    // wallet that receives the USDC payment
        uint256 agentId;        // on-chain ID in AgentRegistry (0 before assignment)
        uint256 amount;         // USDC amount (6 decimals)
        bytes32 taskHash;       // keccak256 of off-chain task description
        bytes32 resultHash;     // keccak256 of submitted result (zero before submission)
        TaskStatus status;
        uint256 createdAt;
        uint256 assignedAt;
        uint256 submittedAt;
        uint256 resolvedAt;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    IReputationRegistry public reputationRegistry;
    bool private _reputationRegistrySet;

    uint256 private _nextTaskId;
    mapping(uint256 => Task) private _tasks;
    mapping(address => uint256[]) private _posterTasks;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event TaskCreated(uint256 indexed taskId, address indexed poster, bytes32 taskHash, uint256 amount);
    event AgentAssigned(uint256 indexed taskId, uint256 indexed agentId, address agentWallet);
    event WorkSubmitted(uint256 indexed taskId, bytes32 resultHash);
    event WorkAccepted(
        uint256 indexed taskId, address indexed poster, address indexed agentWallet, uint256 amount
    );
    event TaskDisputed(uint256 indexed taskId, address indexed poster);
    event DisputeResolved(uint256 indexed taskId, address indexed winner, uint256 amount);
    event TaskRefunded(uint256 indexed taskId, address indexed poster, uint256 amount);
    event ReputationRegistrySet(address indexed registry);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error TaskNotFound(uint256 taskId);
    error WrongStatus(uint256 taskId, TaskStatus expected, TaskStatus actual);
    error NotTaskPoster(uint256 taskId, address caller);
    error NotAssignedAgent(uint256 taskId, address caller);
    error InsufficientAmount();
    error ZeroAddress();
    error ReputationRegistryAlreadySet();
    error InvalidRating(uint8 rating);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @param usdc_  USDC token address (6 decimals).
    ///               Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    ///               Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    /// @param owner_ Initial owner (multisig in production — can pause and resolve disputes).
    constructor(address usdc_, address owner_) Ownable(owner_) {
        if (usdc_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        usdc = IERC20(usdc_);
        _nextTaskId = 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Wire up the ReputationRegistry after both contracts are deployed.
    ///         Can only be called once by the owner.
    /// @dev    acceptWork() gracefully skips the reputation write if this is not set,
    ///         so tasks can be completed before the registry is wired.
    function setReputationRegistry(address registry_) external onlyOwner {
        if (_reputationRegistrySet) revert ReputationRegistryAlreadySet();
        if (registry_ == address(0)) revert ZeroAddress();
        reputationRegistry = IReputationRegistry(registry_);
        _reputationRegistrySet = true;
        emit ReputationRegistrySet(registry_);
    }

    /// @notice Pause new task creation. Existing tasks are unaffected.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause task creation.
    function unpause() external onlyOwner {
        _unpause();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Poster actions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Create a task and immediately lock USDC into escrow.
    /// @dev    Caller must have pre-approved this contract for `amount` USDC.
    /// @param taskHash keccak256 of the off-chain task description.
    /// @param amount   USDC amount in token units (6 decimals). Must be > 0.
    /// @return taskId  Sequential task identifier starting at 1.
    function createTask(
        bytes32 taskHash,
        uint256 amount
    ) external whenNotPaused nonReentrant returns (uint256 taskId) {
        if (amount == 0) revert InsufficientAmount();

        taskId = _nextTaskId++;

        _tasks[taskId] = Task({
            id: taskId,
            poster: msg.sender,
            agentWallet: address(0),
            agentId: 0,
            amount: amount,
            taskHash: taskHash,
            resultHash: bytes32(0),
            status: TaskStatus.Funded,
            createdAt: block.timestamp,
            assignedAt: 0,
            submittedAt: 0,
            resolvedAt: 0
        });
        _posterTasks[msg.sender].push(taskId);

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit TaskCreated(taskId, msg.sender, taskHash, amount);
    }

    /// @notice Assign a winning agent bid to this task.
    /// @param taskId      Task to assign.
    /// @param agentId     On-chain agent ID from AgentRegistry.
    /// @param agentWallet Wallet address that will receive the USDC payment.
    function assignAgent(
        uint256 taskId,
        uint256 agentId,
        address agentWallet
    ) external {
        _requirePoster(taskId);
        _requireStatus(taskId, TaskStatus.Funded);
        if (agentWallet == address(0)) revert ZeroAddress();

        Task storage task = _tasks[taskId];
        task.agentWallet = agentWallet;
        task.agentId = agentId;
        task.status = TaskStatus.Assigned;
        task.assignedAt = block.timestamp;

        emit AgentAssigned(taskId, agentId, agentWallet);
    }

    /// @notice Accept the agent's submitted work, release escrow, and write reputation.
    /// @param taskId     Task to accept.
    /// @param rating     Integer 1–5 star rating for the agent.
    /// @param reviewHash keccak256 of the off-chain review text. Use bytes32(0) to skip.
    function acceptWork(
        uint256 taskId,
        uint8 rating,
        bytes32 reviewHash
    ) external nonReentrant {
        _requirePoster(taskId);
        _requireStatus(taskId, TaskStatus.Submitted);
        if (rating == 0 || rating > 5) revert InvalidRating(rating);

        Task storage task = _tasks[taskId];
        task.status = TaskStatus.Released;
        task.resolvedAt = block.timestamp;

        address agentWallet = task.agentWallet;
        uint256 amount = task.amount;

        // Write reputation before transferring funds (CEI pattern).
        if (_reputationRegistrySet) {
            reputationRegistry.addReview(
                task.agentId, taskId, rating, reviewHash, msg.sender
            );
        }

        usdc.safeTransfer(agentWallet, amount);

        emit WorkAccepted(taskId, msg.sender, agentWallet, amount);
    }

    /// @notice Dispute the submitted work. Locks escrow pending admin resolution.
    function dispute(uint256 taskId) external {
        _requirePoster(taskId);
        _requireStatus(taskId, TaskStatus.Submitted);

        _tasks[taskId].status = TaskStatus.Disputed;

        emit TaskDisputed(taskId, msg.sender);
    }

    /// @notice Refund the poster's USDC before an agent is assigned.
    ///         Can only be called while the task is in Funded status.
    function refundTask(uint256 taskId) external nonReentrant {
        _requirePoster(taskId);
        _requireStatus(taskId, TaskStatus.Funded);

        Task storage task = _tasks[taskId];
        task.status = TaskStatus.Refunded;
        task.resolvedAt = block.timestamp;

        uint256 amount = task.amount;
        usdc.safeTransfer(task.poster, amount);

        emit TaskRefunded(taskId, task.poster, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Agent action
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Submit completed work for poster review.
    /// @param taskId     Task being submitted.
    /// @param resultHash keccak256 of the off-chain result artifact URI.
    function submitWork(uint256 taskId, bytes32 resultHash) external {
        Task storage task = _tasks[taskId];
        if (task.poster == address(0)) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.Assigned) {
            revert WrongStatus(taskId, TaskStatus.Assigned, task.status);
        }
        if (task.agentWallet != msg.sender) revert NotAssignedAgent(taskId, msg.sender);

        task.resultHash = resultHash;
        task.status = TaskStatus.Submitted;
        task.submittedAt = block.timestamp;

        emit WorkSubmitted(taskId, resultHash);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Owner action
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Resolve a disputed task. Only callable by the contract owner (multisig).
    /// @param taskId          The disputed task.
    /// @param releaseToAgent  true → send USDC to agent (work accepted); false → refund poster.
    function resolveDispute(uint256 taskId, bool releaseToAgent) external onlyOwner nonReentrant {
        _requireStatus(taskId, TaskStatus.Disputed);

        Task storage task = _tasks[taskId];
        task.resolvedAt = block.timestamp;
        uint256 amount = task.amount;

        if (releaseToAgent) {
            task.status = TaskStatus.Released;
            usdc.safeTransfer(task.agentWallet, amount);
            emit DisputeResolved(taskId, task.agentWallet, amount);
        } else {
            task.status = TaskStatus.Refunded;
            usdc.safeTransfer(task.poster, amount);
            emit DisputeResolved(taskId, task.poster, amount);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Return the full Task struct for a given ID.
    function getTask(uint256 taskId) external view returns (Task memory) {
        if (_tasks[taskId].poster == address(0)) revert TaskNotFound(taskId);
        return _tasks[taskId];
    }

    /// @notice Return all task IDs created by a given poster address.
    function getPosterTasks(address poster) external view returns (uint256[] memory) {
        return _posterTasks[poster];
    }

    /// @notice Total tasks ever created (including completed/refunded).
    function totalTasks() external view returns (uint256) {
        return _nextTaskId - 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _requirePoster(uint256 taskId) internal view {
        Task storage task = _tasks[taskId];
        if (task.poster == address(0)) revert TaskNotFound(taskId);
        if (task.poster != msg.sender) revert NotTaskPoster(taskId, msg.sender);
    }

    function _requireStatus(uint256 taskId, TaskStatus expected) internal view {
        TaskStatus actual = _tasks[taskId].status;
        if (actual != expected) revert WrongStatus(taskId, expected, actual);
    }
}
