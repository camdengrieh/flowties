# Flow NFT Notification Dashboard Setup

A comprehensive NFT activity monitoring and notification system for Flow blockchain, built with NextJS, Privy authentication, and Ponder indexing.

## Overview

This system provides real-time notifications and alerts for Flow NFT marketplace activity including:
- 💰 Sales completed notifications
- 🏷️ New listings and delistings
- 🎯 Offer received alerts
- 📈 Collection volume surge detection
- 👤 User activity monitoring
- 📱 Multi-channel delivery (In-app, SMS, Telegram)

## Architecture

### Frontend (NextJS)
- **Dashboard**: Real-time activity feed, notifications, and watchlist management
- **Authentication**: Privy integration with wallet, email, and Google login
- **API Routes**: RESTful endpoints for notifications, subscriptions, events, and watchlist
- **Components**: Modular React components for notifications, activity feed, and watchlist

### Backend (Ponder)
- **Blockchain Indexing**: Real-time Flow mainnet event tracking
- **Data Storage**: User activity, collection metrics, and notification queue
- **GraphQL API**: Efficient data querying for the frontend

### Notification System
- **In-App**: Real-time dashboard notifications
- **SMS**: Text message alerts via provider integration
- **Telegram**: Bot-based notifications
- **Processing**: Queue-based notification delivery system

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd flowties
pnpm install
```

### 2. Environment Configuration

Create `.env.local` in the root directory:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Ponder Configuration (Backend)
PONDER_DATABASE_URL=postgresql://localhost:5432/ponder
PONDER_RPC_URL_747=https://mainnet.evm.nodes.onflow.org

# Optional: Notification Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 3. Setup Privy Authentication

1. Visit [Privy Dashboard](https://dashboard.privy.io)
2. Create a new application
3. Configure allowed domains (localhost:3000 for development)
4. Enable login methods:
   - ✅ Email
   - ✅ Wallet (Ethereum/Flow compatible)
   - ✅ Google OAuth
5. Copy your App ID to the environment file

### 4. Start the Ponder Backend

```bash
cd backend
pnpm install
pnpm dev
```

The Ponder backend will:
- Start indexing Flow mainnet from the latest block
- Set up PostgreSQL database schema
- Expose GraphQL API on `localhost:42069`
- Begin tracking marketplace events and user activity

### 5. Start the NextJS Frontend

```bash
pnpm dev
```

The dashboard will be available at `http://localhost:3000`

## Features

### 🏠 Dashboard
- **Real-time Activity Feed**: Live marketplace events with filtering
- **Notification Center**: Unread notifications with action buttons
- **Watchlist Management**: Track collections, users, and specific NFTs
- **Volume Metrics**: Collection and user trading statistics

### 🔔 Notification System
- **Event Types**:
  - Sale completed (buyer/seller notifications)
  - Offer received (direct and collection-wide)
  - Volume surge alerts
  - User activity monitoring
- **Delivery Channels**:
  - In-app dashboard notifications
  - SMS text messages
  - Telegram bot messages
- **Subscription Management**:
  - Granular notification preferences
  - Target-specific alerts (specific collections/users)
  - Channel-specific enable/disable

### 📊 Data Tracking
- **Marketplace Events**: Sales, listings, delistings from Flow marketplaces
- **User Activity**: Trading volume, items bought/sold, last activity
- **Collection Metrics**: Floor price, volume, owner count
- **Volume Snapshots**: Historical data for surge detection

## API Reference

### Events API
```
GET /api/events
```
Query parameters:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `eventType`: Filter by 'sale', 'listing', 'delisting'
- `collection`: Filter by collection address
- `userAddress`: Filter by user activity
- `timeRange`: '1h', '6h', '24h', '7d', '30d'

### Notifications API
```
GET /api/notifications?address={userAddress}
PATCH /api/notifications (mark as read)
PUT /api/notifications (mark all as read)
```

### Watchlist API
```
GET /api/watchlist?address={userAddress}&type={collections|users|nfts|all}
POST /api/watchlist (add item)
PUT /api/watchlist (update settings)
DELETE /api/watchlist?id={itemId}
```

### Subscriptions API
```
GET /api/subscriptions?address={userAddress}
POST /api/subscriptions (create subscription)
DELETE /api/subscriptions?id={subscriptionId}
```

## Ponder Configuration

The backend tracks the following Flow mainnet contracts:

### FlowtyMarketplace (Sales & Listings)
- **Address**: `0x55739a669b655341` (placeholder - update with actual)
- **Events**: Sale, Listed, Delisted
- **Purpose**: Primary marketplace activity tracking

### ERC721 Transfers
- **Purpose**: General NFT transfer monitoring
- **Use**: User activity tracking and volume calculations

### Data Schema
```sql
-- User activity and metrics
CREATE TABLE User (
  id TEXT PRIMARY KEY,
  totalVolumeSold NUMERIC,
  totalVolumeBought NUMERIC,
  totalItemsSold INTEGER,
  totalItemsBought INTEGER,
  lastActivity INTEGER
);

-- Collection data and metrics
CREATE TABLE Collection (
  id TEXT PRIMARY KEY,
  name TEXT,
  symbol TEXT,
  totalVolume NUMERIC,
  owners INTEGER,
  floorPrice NUMERIC
);

-- Marketplace sales tracking
CREATE TABLE Sale (
  id TEXT PRIMARY KEY,
  collection TEXT,
  tokenId TEXT,
  seller TEXT,
  buyer TEXT,
  price NUMERIC,
  currency TEXT,
  platform TEXT,
  timestamp INTEGER,
  blockNumber NUMERIC
);

-- User subscriptions for notifications
CREATE TABLE UserSubscription (
  id TEXT PRIMARY KEY,
  userAddress TEXT,
  subscriptionType TEXT,
  target TEXT,
  isActive BOOLEAN,
  enableInApp BOOLEAN,
  enableSms BOOLEAN,
  enableTelegram BOOLEAN,
  smsNumber TEXT,
  telegramChatId TEXT
);

-- Notification queue and history
CREATE TABLE NotificationQueue (
  id TEXT PRIMARY KEY,
  userAddress TEXT,
  type TEXT,
  title TEXT,
  message TEXT,
  data TEXT,
  inAppSent BOOLEAN,
  smsSent BOOLEAN,
  telegramSent BOOLEAN,
  createdAt INTEGER,
  readAt INTEGER
);
```

## Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend (Railway/Render)
1. Deploy Ponder backend to Railway or Render
2. Set PostgreSQL database connection
3. Configure Flow RPC endpoint
4. Set environment variables for notification services

### Database
- **Development**: Local PostgreSQL
- **Production**: Supabase, Railway, or Neon PostgreSQL

## Notification Services Setup

### SMS (Twilio)
1. Create Twilio account
2. Get Account SID and Auth Token
3. Purchase phone number
4. Add credentials to environment

### Telegram
1. Create bot via @BotFather
2. Get bot token
3. Set up webhook for user registration
4. Add token to environment

## Monitoring

The system includes built-in monitoring for:
- 📊 Event indexing status
- 🔔 Notification delivery rates
- 📈 User engagement metrics
- ⚡ API response times

## Troubleshooting

### Common Issues

**Ponder not indexing events:**
- Check Flow RPC endpoint connectivity
- Verify contract addresses are correct
- Check PostgreSQL connection

**Notifications not sending:**
- Verify user subscriptions are active
- Check notification service credentials
- Review notification processing logs

**Authentication issues:**
- Confirm Privy App ID and domain settings
- Check environment variables
- Verify wallet connection

### Logs
- Ponder logs: Check backend console
- NextJS logs: Check browser console and server logs
- Notification logs: Check API route responses

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request with detailed description

## License

MIT License - see LICENSE file for details 