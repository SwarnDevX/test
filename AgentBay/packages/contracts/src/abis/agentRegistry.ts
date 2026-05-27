// Targets: AgentRegistry.sol — Solidity 0.8.24, OpenZeppelin v5.3.0
// viem v2 requires `as const` for full type inference on ABI arrays.

export const agentRegistryAbi = [
  // ── Errors ────────────────────────────────────────────────────────────────
  {
    type: 'error',
    name: 'AgentAlreadyActive',
    inputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'error',
    name: 'AgentAlreadyInactive',
    inputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'error',
    name: 'AgentNotFound',
    inputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'error',
    name: 'EmptyMetadataURI',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotAgentOwner',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'caller', type: 'address' },
    ],
  },

  // ── Events ────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'AgentDeactivated',
    inputs: [{ name: 'agentId', type: 'uint256', indexed: true }],
  },
  {
    type: 'event',
    name: 'AgentReactivated',
    inputs: [{ name: 'agentId', type: 'uint256', indexed: true }],
  },
  {
    type: 'event',
    name: 'AgentRegistered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AgentUpdated',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
      { name: 'capabilities', type: 'string[]', indexed: false },
    ],
  },

  // ── Functions ─────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'deactivate',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getAgent',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'owner', type: 'address' },
          { name: 'metadataURI', type: 'string' },
          { name: 'capabilities', type: 'string[]' },
          { name: 'registeredAt', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getAgentsByOwner',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'reactivate',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'metadataURI', type: 'string' },
      { name: 'capabilities', type: 'string[]' },
    ],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalAgents',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'update',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
      { name: 'capabilities', type: 'string[]' },
    ],
    outputs: [],
  },
] as const;

export type AgentRegistryAbi = typeof agentRegistryAbi;
