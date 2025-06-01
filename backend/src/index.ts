import { ponder } from "ponder:registry";
import { 
  sale, 
  offer, 
  cancellation, 
  user
} from "ponder:schema";

// Seaport OrderFulfilled - When NFTs are sold
ponder.on("Seaport:OrderFulfilled", async ({ event, context }) => {
  const { orderHash, offerer, recipient, offer: offerItems, consideration } = event.args;
  const timestamp = Number(event.block.timestamp);

  console.log(`Processing Seaport OrderFulfilled: ${orderHash}`);

  try {
    // Extract NFT and payment information from offer and consideration
    let nftContract: `0x${string}` = "0x0000000000000000000000000000000000000000";
    let tokenId = "";
    let price = BigInt(0);
    let currency = "FLOW";
    let currencyAddress: `0x${string}` = "0x0000000000000000000000000000000000000000";

    // Find NFT in the offer (what the seller is giving)
    for (const item of offerItems) {
      if (item.itemType === 2 || item.itemType === 3) { // ERC721 or ERC1155
        nftContract = item.token;
        tokenId = item.identifier.toString();
        break;
      }
    }

    // Find payment in consideration (what the buyer is paying)
    for (const item of consideration) {
      if (item.itemType === 0 || item.itemType === 1) { // ETH or ERC20
        price = item.amount;
        if (item.token !== "0x0000000000000000000000000000000000000000") {
          currency = "TOKEN";
          currencyAddress = item.token;
        }
        break;
      }
    }

    // Record the sale
    await context.db.insert(sale).values({
      id: `${event.transaction.hash}-${event.log.logIndex}`,
      orderHash: orderHash,
      collection: nftContract,
      tokenId: tokenId,
      seller: offerer,
      buyer: recipient,
      price: price,
      currency: currency,
      currencyAddress: currencyAddress,
      platform: "Seaport",
      blockNumber: event.block.number,
      timestamp: timestamp,
      gasUsed: event.transaction.gas || BigInt(0),
      gasPrice: event.transaction.gasPrice || BigInt(0),
    });

    // Update user statistics
    await context.db.insert(user).values({
      id: offerer,
      totalVolumeSold: price,
      totalItemsSold: 1,
      totalVolumeBought: BigInt(0),
      totalItemsBought: 0,
      firstSeen: timestamp,
      lastActivity: timestamp,
    }).onConflictDoUpdate((row) => ({
      totalVolumeSold: row.totalVolumeSold + price,
      totalItemsSold: row.totalItemsSold + 1,
      lastActivity: timestamp,
    }));

    await context.db.insert(user).values({
      id: recipient,
      totalVolumeSold: BigInt(0),
      totalItemsSold: 0,
      totalVolumeBought: price,
      totalItemsBought: 1,
      firstSeen: timestamp,
      lastActivity: timestamp,
    }).onConflictDoUpdate((row) => ({
      totalVolumeBought: row.totalVolumeBought + price,
      totalItemsBought: row.totalItemsBought + 1,
      lastActivity: timestamp,
    }));

    console.log(`Seaport sale recorded successfully: ${tokenId} for ${price}`);
  } catch (error) {
    console.error('Failed to record Seaport sale:', error);
  }
});

// Seaport OrderValidated - When orders are created (listings/offers)
ponder.on("Seaport:OrderValidated", async ({ event, context }) => {
  const { orderHash, offerer, zone } = event.args;
  const timestamp = Number(event.block.timestamp);

  console.log(`Processing Seaport OrderValidated: ${orderHash}`);

  try {
    // Note: OrderValidated doesn't contain the full order details
    // In a full implementation, you'd need to:
    // 1. Use context.client.readContract() to get order details from Seaport
    // 2. Or listen to frontend order creation events
    // 3. Or use OpenSea API to get order metadata
    
    // For now, record a basic offer entry
    await context.db.insert(offer).values({
      id: `${event.transaction.hash}-${event.log.logIndex}`,
      collection: "0x0000000000000000000000000000000000000000", // Would need to fetch from contract
      tokenId: "", // Would need to fetch from contract
      offerer: offerer,
      recipient: undefined,
      price: BigInt(0), // Would need to fetch from contract
      currency: "FLOW",
      currencyAddress: "0x0000000000000000000000000000000000000000",
      platform: "Seaport",
      expirationTime: undefined,
      status: "active",
      blockNumber: event.block.number,
      timestamp: timestamp,
    });

    console.log(`Seaport order validated recorded`);
  } catch (error) {
    console.error('Failed to record Seaport order validation:', error);
  }
});

// Seaport OrderCancelled - When orders are cancelled
ponder.on("Seaport:OrderCancelled", async ({ event, context }) => {
  const { orderHash, offerer, zone } = event.args;
  const timestamp = Number(event.block.timestamp);

  console.log(`Processing Seaport OrderCancelled: ${orderHash}`);

  try {
    // Record the cancellation
    await context.db.insert(cancellation).values({
      id: `${event.transaction.hash}-${event.log.logIndex}`,
      orderHash: orderHash,
      offerer: offerer,
      timestamp: timestamp,
      blockNumber: event.block.number,
    });

    console.log(`Seaport cancellation recorded successfully`);
  } catch (error) {
    console.error('Failed to record Seaport cancellation:', error);
  }
});
