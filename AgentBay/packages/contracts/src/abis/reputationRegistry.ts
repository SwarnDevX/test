// Targets: ReputationRegistry.sol — Solidity 0.8.24, OpenZeppelin v5.3.0
// viem v2 requires `as const` for full type inference on ABI arrays.

export const reputationRegistryAbi = [
  // ── Constructor ───────────────────────────────────────────────────────────
  {
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskEscrow_', type: 'address' }],
  },

  // ── Errors ────────────────────────────────────────────────────────────────
  {
    type: 'error',
    name: 'InvalidRating',
    inputs: [{ name: 'rating', type: 'uint8' }],
  },
  {
    type: 'error',
    name: 'OnlyTaskEscrow',
    inputs: [{ name: 'caller', type: 'address' }],
  },
  {
    type: 'error',
    name: 'TaskAlreadyReviewed',
    inputs: [{ name: 'taskId', type: 'uint256' }],
  },
  {
    type: 'error',
    name: 'ZeroAddress',
    inputs: [],
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'ReviewAdded',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'rating', type: 'uint8', indexed: false },
      { name: 'hashOfReview', type: 'bytes32', indexed: false },
      { name: 'reviewer', type: 'address', indexed: true },
    ],
  },

  // ── Functions ─────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'addReview',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'taskId', type: 'uint256' },
      { name: 'rating', type: 'uint8' },
      { name: 'hashOfReview', type: 'bytes32' },
      { name: 'reviewer', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getReputationScore',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      { name: 'average', type: 'uint256' },
      { name: 'count', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getReviews',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'agentId', type: 'uint256' },
          { name: 'taskId', type: 'uint256' },
          { name: 'rating', type: 'uint8' },
          { name: 'hashOfReview', type: 'bytes32' },
          { name: 'reviewer', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'isTaskReviewed',
    stateMutability: 'view',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'taskEscrow',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

export type ReputationRegistryAbi = typeof reputationRegistryAbi;
