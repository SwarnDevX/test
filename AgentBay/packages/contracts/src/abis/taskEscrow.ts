// Targets: TaskEscrow.sol — Solidity 0.8.24, OpenZeppelin v5.3.0 (Pausable, Ownable2Step, ReentrancyGuard)
// viem v2 requires `as const` for full type inference on ABI arrays.

export const taskEscrowAbi = [
  // ── Constructor ───────────────────────────────────────────────────────────
  {
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'usdc_', type: 'address' },
      { name: 'owner_', type: 'address' },
    ],
  },

  // ── Errors ────────────────────────────────────────────────────────────────
  {
    type: 'error',
    name: 'EnforcedPause',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ExpectedPause',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidRating',
    inputs: [{ name: 'rating', type: 'uint8' }],
  },
  {
    type: 'error',
    name: 'NotAssignedAgent',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'caller', type: 'address' },
    ],
  },
  {
    type: 'error',
    name: 'NotTaskPoster',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'caller', type: 'address' },
    ],
  },
  // OZ Ownable error
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [{ name: 'owner', type: 'address' }],
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address' }],
  },
  {
    type: 'error',
    name: 'ReputationRegistryAlreadySet',
    inputs: [],
  },
  {
    type: 'error',
    name: 'TaskNotFound',
    inputs: [{ name: 'taskId', type: 'uint256' }],
  },
  {
    type: 'error',
    name: 'WrongStatus',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'expected', type: 'uint8' },
      { name: 'actual', type: 'uint8' },
    ],
  },
  {
    type: 'error',
    name: 'ZeroAddress',
    inputs: [],
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'AgentAssigned',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentWallet', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DisputeResolved',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'winner', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  // OZ Ownable2Step events
  {
    type: 'event',
    name: 'OwnershipTransferStarted',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true },
      { name: 'newOwner', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true },
      { name: 'newOwner', type: 'address', indexed: true },
    ],
  },
  // OZ Pausable events
  {
    type: 'event',
    name: 'Paused',
    inputs: [{ name: 'account', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'ReputationRegistrySet',
    inputs: [{ name: 'registry', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'TaskCreated',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'poster', type: 'address', indexed: true },
      { name: 'taskHash', type: 'bytes32', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TaskDisputed',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'poster', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'TaskRefunded',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'poster', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [{ name: 'account', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'WorkAccepted',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'poster', type: 'address', indexed: true },
      { name: 'agentWallet', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WorkSubmitted',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'resultHash', type: 'bytes32', indexed: false },
    ],
  },

  // ── Functions ─────────────────────────────────────────────────────────────

  // Ownable2Step
  {
    type: 'function',
    name: 'acceptOwnership',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'acceptWork',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'rating', type: 'uint8' },
      { name: 'reviewHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'assignAgent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'agentId', type: 'uint256' },
      { name: 'agentWallet', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'createTask',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskHash', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'taskId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'dispute',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getPosterTasks',
    stateMutability: 'view',
    inputs: [{ name: 'poster', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getTask',
    stateMutability: 'view',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'poster', type: 'address' },
          { name: 'agentWallet', type: 'address' },
          { name: 'agentId', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'taskHash', type: 'bytes32' },
          { name: 'resultHash', type: 'bytes32' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'assignedAt', type: 'uint256' },
          { name: 'submittedAt', type: 'uint256' },
          { name: 'resolvedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'pause',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'paused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'pendingOwner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'refundTask',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'reputationRegistry',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'resolveDispute',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'releaseToAgent', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setReputationRegistry',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'registry_', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'submitWork',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'resultHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'totalTasks',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transferOwnership',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newOwner', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'unpause',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'usdc',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

export type TaskEscrowAbi = typeof taskEscrowAbi;

// TaskStatus enum values — mirrors the Solidity enum order
export const TaskStatus = {
  Created: 0,
  Funded: 1,
  Assigned: 2,
  Submitted: 3,
  Released: 4,
  Disputed: 5,
  Refunded: 6,
} as const;

export type TaskStatusValue = (typeof TaskStatus)[keyof typeof TaskStatus];
