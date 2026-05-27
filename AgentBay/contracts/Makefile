-include ../.env

.PHONY: install build test coverage clean deploy-sepolia deploy-mainnet verify-sepolia verify-mainnet

install:
	forge install OpenZeppelin/openzeppelin-contracts@v5.3.0 --no-commit
	forge install foundry-rs/forge-std --no-commit

build:
	forge build

test:
	forge test -vvv

test-gas:
	forge test --gas-report

coverage:
	forge coverage --report summary

coverage-lcov:
	forge coverage --report lcov

deploy-sepolia:
	forge script script/Deploy.s.sol \
		--rpc-url $(BASE_SEPOLIA_RPC_URL) \
		--private-key $(OPERATOR_PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(BASESCAN_API_KEY)

deploy-mainnet:
	forge script script/Deploy.s.sol \
		--rpc-url $(BASE_MAINNET_RPC_URL) \
		--private-key $(OPERATOR_PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(BASESCAN_API_KEY)

verify-sepolia:
	forge verify-contract $(CONTRACT_AGENT_REGISTRY_ADDRESS) \
		src/AgentRegistry.sol:AgentRegistry \
		--chain base-sepolia \
		--etherscan-api-key $(BASESCAN_API_KEY)
	forge verify-contract $(CONTRACT_TASK_ESCROW_ADDRESS) \
		src/TaskEscrow.sol:TaskEscrow \
		--chain base-sepolia \
		--etherscan-api-key $(BASESCAN_API_KEY) \
		--constructor-args $$(cast abi-encode "constructor(address,address)" \
			$(USDC_ADDRESS_BASE_SEPOLIA) $(OPERATOR_WALLET_ADDRESS))
	forge verify-contract $(CONTRACT_REPUTATION_REGISTRY_ADDRESS) \
		src/ReputationRegistry.sol:ReputationRegistry \
		--chain base-sepolia \
		--etherscan-api-key $(BASESCAN_API_KEY) \
		--constructor-args $$(cast abi-encode "constructor(address)" \
			$(CONTRACT_TASK_ESCROW_ADDRESS))

clean:
	forge clean
