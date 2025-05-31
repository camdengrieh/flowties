# Contract Reading with Ponder Integration Guide

## Overview
This guide explains how to use Ponder's `context.client.readContract()` to enrich NFT data and the fixes made to the Events API.

## What Was Fixed

### 1. Events API GraphQL Issues
**Problem**: The Events API was using incorrect GraphQL queries that didn't match the Ponder schema.

**Solution**: Updated the API to use correct Ponder table names and query syntax:
- `sales` → `sale`
- `offers` → `offer` 
- `cancellations` → `cancellation`
- `collections` → `collection`
- Fixed argument names (`first`/`skip` → `limit`/`offset`)
- Updated GraphQL endpoint from `42070` to `42069`

### 2. Authentication Integration
**Completed**: All components now use Privy authentication with proper user identification via Privy DID instead of wallet addresses.

### 3. Contract Reading Implementation
**Added**: Enhanced Ponder indexing functions that use `context.client.readContract()` to read NFT metadata.

## Contract Reading Examples

### 1. Reading NFT Metadata in Sales Events

```typescript
ponder.on("FlowtyMarketplace:Sale", async ({ event, context }) => {
  const { nftContract, tokenId, price, seller, buyer } = event.args;

  // Read NFT metadata using readContract
  let tokenUri: string | undefined;
  let collectionName: string | undefined;

  try {
    // Read token URI
    tokenUri = await context.client.readContract({
      address: nftContract,
      abi: [
        {
          "inputs": [{"name": "tokenId", "type": "uint256"}],
          "name": "tokenURI",
          "outputs": [{"name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: "tokenURI",
      args: [tokenId],
    });

    // Read collection name
    collectionName = await context.client.readContract({
      address: nftContract,
      abi: [
        {
          "inputs": [],
          "name": "name",
          "outputs": [{"name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: "name",
    });
  } catch (error) {
    console.error('Failed to read contract data:', error);
  }

  // Use the enriched data in your database record
  await context.db.insert(sale).values({
    // ... other fields
    // You can now use tokenUri and collectionName
  });
});
```

### 2. Verifying Token Ownership

```typescript
ponder.on("FlowtyMarketplace:Listed", async ({ event, context }) => {
  const { nftContract, tokenId, seller } = event.args;

  // Verify the seller actually owns the token
  let currentOwner: string | undefined;
  try {
    currentOwner = await context.client.readContract({
      address: nftContract,
      abi: [
        {
          "inputs": [{"name": "tokenId", "type": "uint256"}],
          "name": "ownerOf",
          "outputs": [{"name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: "ownerOf",
      args: [tokenId],
    });

    if (currentOwner?.toLowerCase() !== seller.toLowerCase()) {
      console.error('Seller does not own the token!');
      return; // Skip processing invalid listing
    }
  } catch (error) {
    console.error('Failed to verify ownership:', error);
  }
});
```

### 3. Reading Collection Statistics

```typescript
ponder.on("ERC721Transfers:Transfer", async ({ event, context }) => {
  const { tokenId } = event.args;

  // Get total supply for collection stats
  let totalSupply: bigint | undefined;
  try {
    totalSupply = await context.client.readContract({
      address: event.log.address,
      abi: [
        {
          "inputs": [],
          "name": "totalSupply",
          "outputs": [{"name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        }
      ],
      functionName: "totalSupply",
    });

    // Update collection with real total supply
    await context.db.insert(collection).values({
      id: event.log.address,
      totalSupply: Number(totalSupply),
      // ... other fields
    }).onConflictDoUpdate((row) => ({
      totalSupply: Number(totalSupply),
      updatedAt: event.block.timestamp,
    }));
  } catch (error) {
    console.error('Failed to read total supply:', error);
  }
});
```

## Key Benefits

### 1. Performance & Caching
- Ponder automatically caches RPC responses for efficiency
- Block number is set automatically to the current event's block
- No need to manually setup Viem clients

### 2. Enriched Data
- Real NFT metadata instead of placeholder data
- Verified collection names and symbols
- Accurate token ownership verification
- Real-time collection statistics

### 3. Error Handling
- Graceful fallbacks when contract calls fail
- Proper error logging for debugging
- Continues processing even if enrichment fails

## Running the System

### 1. Start Ponder Backend
```bash
cd backend
pnpm start
```

### 2. Start Frontend
```bash
pnpm dev
```

### 3. Check GraphQL Endpoint
Visit `http://localhost:42069/graphql` to test queries.

## Next Steps

1. **Connect to Real Flow Contracts**: Update contract addresses in `backend/ponder.config.ts`
2. **Add More Metadata**: Read additional fields like royalties, creator info, etc.
3. **IPFS Integration**: Parse token URIs and fetch metadata from IPFS
4. **Enhanced Validation**: Add more contract read validations for data integrity
5. **Collection Discovery**: Use contract reading to automatically discover new collections

## Troubleshooting

### GraphQL Errors
- Ensure Ponder backend is running on port 42069
- Check that table names match your schema
- Verify query syntax follows Ponder conventions

### Contract Reading Errors
- Ensure contract addresses are correct
- Verify ABI functions exist on the contract
- Check that you're reading at the correct block height

### Authentication Issues
- Verify Privy environment variables are set
- Check that user sync is working properly
- Ensure API routes use `privyId` instead of wallet addresses 