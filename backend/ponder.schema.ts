import { onchainTable } from "ponder";

// NFT Collections
export const collection = onchainTable("collection", (t) => ({
  id: t.hex().primaryKey(), // Contract address
  name: t.text().notNull(),
  symbol: t.text().notNull(),
  totalVolume: t.bigint().notNull().default(BigInt(0)),
  totalSales: t.integer().notNull().default(0),
  floorPrice: t.bigint(),
  owners: t.integer().notNull().default(0),
  totalSupply: t.integer().notNull().default(0),
  // Volume tracking for surge detection
  volume24h: t.bigint().notNull().default(BigInt(0)),
  volume7d: t.bigint().notNull().default(BigInt(0)),
  sales24h: t.integer().notNull().default(0),
  sales7d: t.integer().notNull().default(0),
  createdAt: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
}));

// Users/Traders
export const user = onchainTable("user", (t) => ({
  id: t.hex().primaryKey(), // Wallet address
  totalVolumeSold: t.bigint().notNull().default(BigInt(0)),
  totalItemsSold: t.integer().notNull().default(0),
  totalVolumeBought: t.bigint().notNull().default(BigInt(0)),
  totalItemsBought: t.integer().notNull().default(0),
  firstSeen: t.integer().notNull(),
  lastActivity: t.integer().notNull(),
}));

// Individual NFT Sales
export const sale = onchainTable("sale", (t) => ({
  id: t.text().primaryKey(), // tx_hash-log_index
  orderHash: t.hex().notNull(),
  collection: t.hex().notNull(),
  tokenId: t.text().notNull(),
  seller: t.hex().notNull(),
  buyer: t.hex().notNull(),
  price: t.bigint().notNull(),
  currency: t.text().notNull(),
  currencyAddress: t.hex().notNull(),
  platform: t.text().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.integer().notNull(),
  gasUsed: t.bigint().notNull(),
  gasPrice: t.bigint().notNull(),
}));

// NFT Offers/Bids
export const offer = onchainTable("offer", (t) => ({
  id: t.text().primaryKey(), // tx_hash-log_index
  collection: t.hex().notNull(),
  tokenId: t.text(),
  offerer: t.hex().notNull(),
  recipient: t.hex(), // If offer is for specific owner
  price: t.bigint().notNull(),
  currency: t.text().notNull(),
  currencyAddress: t.hex().notNull(),
  platform: t.text().notNull(),
  expirationTime: t.integer(),
  status: t.text().notNull(), // 'active', 'accepted', 'cancelled', 'expired'
  blockNumber: t.bigint().notNull(),
  timestamp: t.integer().notNull(),
}));

// User Notification Subscriptions
export const userSubscription = onchainTable("user_subscription", (t) => ({
  id: t.text().primaryKey(), // user_address-subscription_type-target
  userAddress: t.hex().notNull(),
  subscriptionType: t.text().notNull(), // 'user_activity', 'collection_surge', 'offers_received', 'sales_completed'
  target: t.text(), // Address for user_activity, collection address for collection_surge, null for personal alerts
  isActive: t.boolean().notNull().default(true),
  // Notification channels
  enableInApp: t.boolean().notNull().default(true),
  enableSms: t.boolean().notNull().default(false),
  enableTelegram: t.boolean().notNull().default(false),
  smsNumber: t.text(),
  telegramChatId: t.text(),
  createdAt: t.integer().notNull(),
  updatedAt: t.integer().notNull(),
}));

// Notification Queue
export const notification = onchainTable("notification", (t) => ({
  id: t.text().primaryKey(), // uuid
  userAddress: t.hex().notNull(),
  type: t.text().notNull(), // 'offer_received', 'sale_completed', 'volume_surge', 'user_activity'
  title: t.text().notNull(),
  message: t.text().notNull(),
  data: t.text(), // JSON string with additional data
  // Delivery status
  inAppSent: t.boolean().notNull().default(false),
  smsSent: t.boolean().notNull().default(false),
  telegramSent: t.boolean().notNull().default(false),
  createdAt: t.integer().notNull(),
  readAt: t.integer(),
}));

// Collection Volume Tracking (for surge detection)
export const collectionVolumeSnapshot = onchainTable("collection_volume_snapshot", (t) => ({
  id: t.text().primaryKey(), // collection-timestamp
  collection: t.hex().notNull(),
  timestamp: t.integer().notNull(),
  volume1h: t.bigint().notNull().default(BigInt(0)),
  volume24h: t.bigint().notNull().default(BigInt(0)),
  sales1h: t.integer().notNull().default(0),
  sales24h: t.integer().notNull().default(0),
  avgPrice1h: t.bigint(),
  avgPrice24h: t.bigint(),
}));

// Daily metrics per collection (simplified)
export const dailyCollectionMetrics = onchainTable("daily_collection_metrics", (t) => ({
  id: t.text().primaryKey(), // collection-YYYY-MM-DD
  collection: t.hex().notNull(),
  date: t.text().notNull(),
  volume: t.bigint().notNull().default(BigInt(0)),
  sales: t.integer().notNull().default(0),
  uniqueBuyers: t.integer().notNull().default(0),
  uniqueSellers: t.integer().notNull().default(0),
  avgPrice: t.bigint(),
  minPrice: t.bigint(),
  maxPrice: t.bigint(),
}));

// Daily metrics per user (simplified)
export const dailyUserMetrics = onchainTable("daily_user_metrics", (t) => ({
  id: t.text().primaryKey(), // user-YYYY-MM-DD
  userAddress: t.hex().notNull(),
  date: t.text().notNull(),
  volumeSold: t.bigint().notNull().default(BigInt(0)),
  volumeBought: t.bigint().notNull().default(BigInt(0)),
  itemsSold: t.integer().notNull().default(0),
  itemsBought: t.integer().notNull().default(0),
}));

// Order cancellations
export const cancellation = onchainTable("cancellation", (t) => ({
  id: t.text().primaryKey(), // tx_hash-log_index
  orderHash: t.hex().notNull(),
  offerer: t.hex().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
}));
