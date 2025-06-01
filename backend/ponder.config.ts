import { createConfig } from "ponder";

export default createConfig({
  chains: {
    flowEvm: {
      id: 747, // Flow EVM Mainnet Chain ID
      rpc: "https://mainnet.evm.nodes.onflow.org",
    },
  },
  contracts: {
    // Official Seaport deployment on Flow EVM
    Seaport: {
      chain: "flowEvm",
      abi: [
        // OrderFulfilled - The main event when NFTs are sold via Seaport
        {
          "anonymous": false,
          "inputs": [
            {"indexed": false, "name": "orderHash", "type": "bytes32"},
            {"indexed": true, "name": "offerer", "type": "address"},
            {"indexed": true, "name": "zone", "type": "address"},
            {"indexed": false, "name": "recipient", "type": "address"},
            {
              "indexed": false,
              "name": "offer",
              "type": "tuple[]",
              "components": [
                {"name": "itemType", "type": "uint8"},
                {"name": "token", "type": "address"},
                {"name": "identifier", "type": "uint256"},
                {"name": "amount", "type": "uint256"}
              ]
            },
            {
              "indexed": false,
              "name": "consideration",
              "type": "tuple[]",
              "components": [
                {"name": "itemType", "type": "uint8"},
                {"name": "token", "type": "address"},
                {"name": "identifier", "type": "uint256"},
                {"name": "amount", "type": "uint256"},
                {"name": "recipient", "type": "address"}
              ]
            }
          ],
          "name": "OrderFulfilled",
          "type": "event"
        },
        // OrderValidated - When an order is created/validated
        {
          "anonymous": false,
          "inputs": [
            {"indexed": false, "name": "orderHash", "type": "bytes32"},
            {"indexed": true, "name": "offerer", "type": "address"},
            {"indexed": true, "name": "zone", "type": "address"}
          ],
          "name": "OrderValidated",
          "type": "event"
        },
        // OrderCancelled - When an order is cancelled
        {
          "anonymous": false,
          "inputs": [
            {"indexed": false, "name": "orderHash", "type": "bytes32"},
            {"indexed": true, "name": "offerer", "type": "address"},
            {"indexed": true, "name": "zone", "type": "address"}
          ],
          "name": "OrderCancelled",
          "type": "event"
        }
      ],
      address: "0x0000000000000068F116a894984e2DB1123eB395", // Official Seaport on Flow EVM
      startBlock: 8500000, // Start from Flow EVM genesis or when Seaport was deployed
    },
  },
});
