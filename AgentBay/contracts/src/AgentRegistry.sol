// SPDX-License-Identifier: MIT
// Targets: OpenZeppelin Contracts v5.3.0, Solidity 0.8.24
pragma solidity 0.8.24;

/// @title AgentRegistry
/// @notice ERC-8004-inspired on-chain registry mapping agent owners to metadata URIs
///         and capability arrays. Agents self-register; only the registering owner may
///         update or toggle the active state of their agent.
/// @dev Agent IDs are monotonically increasing uint256s starting at 1.
///      ID 0 is reserved as the "not found" sentinel.
contract AgentRegistry {
    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    struct Agent {
        address owner;
        string metadataURI;
        string[] capabilities;
        uint256 registeredAt;
        bool active;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    uint256 private _nextAgentId;
    mapping(uint256 => Agent) private _agents;
    mapping(address => uint256[]) private _ownerToAgentIds;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string metadataURI);
    event AgentUpdated(uint256 indexed agentId, string metadataURI, string[] capabilities);
    event AgentDeactivated(uint256 indexed agentId);
    event AgentReactivated(uint256 indexed agentId);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error NotAgentOwner(uint256 agentId, address caller);
    error AgentNotFound(uint256 agentId);
    error EmptyMetadataURI();
    error AgentAlreadyInactive(uint256 agentId);
    error AgentAlreadyActive(uint256 agentId);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        _nextAgentId = 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Write functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Register a new agent owned by msg.sender.
    /// @param metadataURI   URI pointing to the agent's off-chain metadata JSON.
    /// @param capabilities  Array of capability strings (e.g., "research", "code_review").
    /// @return agentId      The newly minted agent ID (starts at 1).
    function register(
        string calldata metadataURI,
        string[] calldata capabilities
    ) external returns (uint256 agentId) {
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        agentId = _nextAgentId++;

        string[] memory caps = new string[](capabilities.length);
        for (uint256 i = 0; i < capabilities.length; i++) {
            caps[i] = capabilities[i];
        }

        _agents[agentId] = Agent({
            owner: msg.sender,
            metadataURI: metadataURI,
            capabilities: caps,
            registeredAt: block.timestamp,
            active: true
        });
        _ownerToAgentIds[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, metadataURI);
    }

    /// @notice Update the metadata URI and capabilities of an agent you own.
    function update(
        uint256 agentId,
        string calldata metadataURI,
        string[] calldata capabilities
    ) external {
        _requireOwner(agentId);
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        Agent storage agent = _agents[agentId];
        agent.metadataURI = metadataURI;

        string[] memory caps = new string[](capabilities.length);
        for (uint256 i = 0; i < capabilities.length; i++) {
            caps[i] = capabilities[i];
        }
        agent.capabilities = caps;

        emit AgentUpdated(agentId, metadataURI, capabilities);
    }

    /// @notice Mark an agent as inactive. Inactive agents cannot be assigned new tasks.
    function deactivate(uint256 agentId) external {
        _requireOwner(agentId);
        if (!_agents[agentId].active) revert AgentAlreadyInactive(agentId);
        _agents[agentId].active = false;
        emit AgentDeactivated(agentId);
    }

    /// @notice Re-activate a previously deactivated agent.
    function reactivate(uint256 agentId) external {
        _requireOwner(agentId);
        if (_agents[agentId].active) revert AgentAlreadyActive(agentId);
        _agents[agentId].active = true;
        emit AgentReactivated(agentId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Return the full Agent struct for a given ID.
    /// @dev Reverts if the agent does not exist (owner is address(0)).
    function getAgent(uint256 agentId) external view returns (Agent memory) {
        _requireExists(agentId);
        return _agents[agentId];
    }

    /// @notice Return all agent IDs owned by an address.
    function getAgentsByOwner(address owner) external view returns (uint256[] memory) {
        return _ownerToAgentIds[owner];
    }

    /// @notice Total number of agents ever registered (including inactive ones).
    function totalAgents() external view returns (uint256) {
        return _nextAgentId - 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _requireExists(uint256 agentId) internal view {
        if (_agents[agentId].owner == address(0)) revert AgentNotFound(agentId);
    }

    function _requireOwner(uint256 agentId) internal view {
        _requireExists(agentId);
        if (_agents[agentId].owner != msg.sender) revert NotAgentOwner(agentId, msg.sender);
    }
}
