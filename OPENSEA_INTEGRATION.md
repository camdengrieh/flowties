# OpenSea Integration Guide

This document outlines the OpenSea API integration in the FlowTies dashboard, including real-time event streaming and collection monitoring.

## Features

### Real-Time Event Streaming
- **OpenSea Stream API**: Real-time WebSocket connection for live NFT events
- **Event Types**: Sales, listings, transfers, offers, metadata updates, and cancellations
- **Live Dashboard**: Real-time updates in the activity feed with visual indicators
- **Auto-reconnection**: Automatic reconnection handling for stable connections

### Collection Monitoring
- **Curated Collections**: Pre-configured list of popular NFT collections
- **BeezieCollectibles**: Recently added collection (0xD112634f06902a977db1D596c77715D72f8DA8a9)
- **Featured Collections**: Highlighted collections on the dashboard
- **Collection Stats**: Volume tracking, event counts, and activity metrics

### Dashboard Features
- **Activity Feed**: Combined historical and real-time events with filtering
- **Real-time Stats**: Live updates for 24h events, volume tracked, and collection activity
- **Stream Status**: Visual indicators showing connection status (Live/Historical)
- **Event Filtering**: Filter by event type, time range, and user activity

## Environment Variables

Create a `.env.local` file with your OpenSea API credentials:

```env
# Required: OpenSea API Key
NEXT_PUBLIC_OPENSEA_API_KEY=your_opensea_api_key_here

# Optional: Database URL for Ponder backend
DATABASE_URL=postgresql://user:password@localhost:5432/flowties

# Optional: Webhook secret for additional integrations
OPENSEA_WEBHOOK_SECRET=your_webhook_secret_here
```

## API Endpoints

### Collection Events
- `GET /api/opensea/collections/[slug]/events` - Get historical events for a collection
- `GET /api/opensea/collections/[slug]/stats` - Get collection statistics
- `GET /api/events` - Get aggregated events across all monitored collections

### Real-time Integration
- **Stream Service**: `src/lib/opensea-stream.ts` - Manages WebSocket connections
- **Event Processing**: Transforms OpenSea events to our internal format
- **Type Safety**: Full TypeScript support for all event types

## Collection Management

### Adding New Collections

1. **Update curated collections** (`src/lib/curated-collections.ts`):
```typescript
{
  name: 'New Collection',
  description: 'Collection description',
  contractAddress: '0x...',
  slug: 'collection-slug',
  category: 'art' | 'gaming' | 'sports' | 'utility' | 'music',
  featured: true,
  logoUrl: '/images/collections/logo.png',
  website: 'https://collection.com',
  twitter: 'https://twitter.com/collection'
}
```

2. **Stream subscriptions** are automatically added for new collections

### BeezieCollectibles Integration

**Contract Address**: `0xD112634f06902a977db1D596c77715D72f8DA8a9`
**Category**: Art
**Status**: Featured collection
**Real-time Monitoring**: Enabled

## Stream API Events

### Supported Event Types

1. **Item Listed** (`item_listed`)
   - New NFT listings on OpenSea marketplace
   - Includes pricing, seller, and expiration data

2. **Item Sold** (`item_sold`)
   - Completed sales transactions
   - Includes buyer, seller, and sale price

3. **Item Transferred** (`item_transferred`)
   - NFT ownership transfers
   - Tracks from/to addresses

4. **Item Cancelled** (`item_cancelled`)
   - Listing cancellations
   - Order invalidations

5. **Item Received Offer** (`item_received_offer`)
   - New offers on NFTs
   - Bid tracking

6. **Item Metadata Updated** (`item_metadata_updated`)
   - NFT metadata changes
   - Refresh notifications

### Event Data Structure

```typescript
interface StreamEvent {
  id: string;
  type: 'sale' | 'listing' | 'delisting' | 'transfer' | 'offer' | 'metadata_update';
  collection?: {
    address: string;
    name: string;
    image: string;
    slug: string;
  };
  tokenId?: string;
  seller?: string;
  buyer?: string;
  price?: string;
  currency?: string;
  platform?: string;
  timestamp: number;
  txHash: string;
  blockNumber: string | number;
  event_timestamp: string;
}
```

## Performance Optimizations

### Real-time Updates
- **Event Batching**: Real-time events are batched to prevent UI flooding
- **Memory Management**: Only last 50 real-time events kept in memory
- **Deduplication**: Automatic removal of duplicate events
- **Efficient Filtering**: Client-side filtering for better performance

### API Rate Limiting
- **Stream Events**: No rate limits (push-based)
- **REST API**: Cached responses for 2 minutes
- **Error Handling**: Graceful fallback to historical data

## Troubleshooting

### Common Issues

1. **Stream Connection Failed**
   - Check OpenSea API key validity
   - Verify network connectivity
   - Check browser console for WebSocket errors

2. **No Real-time Events**
   - Ensure API key has Stream API access
   - Check collection slug spelling
   - Verify OpenSea network status

3. **Missing Collection Data**
   - Update collection metadata in curated collections
   - Verify contract address is correct
   - Check OpenSea collection existence

### Debug Mode

Enable debug logging by setting `logLevel: LogLevel.DEBUG` in the stream client configuration.

## Future Enhancements

- **Multi-chain Support**: Extend to other blockchains supported by OpenSea
- **Advanced Filtering**: More granular event filtering options
- **Webhook Integration**: Server-side event processing
- **Analytics Dashboard**: Deeper insights into collection performance
- **Push Notifications**: Browser notifications for important events

## Dependencies

- `@opensea/stream-js`: OpenSea Stream API client
- `@privy-io/react-auth`: User authentication
- `lucide-react`: UI icons
- `viem`: Ethereum utilities

## References

- [OpenSea Stream API Documentation](https://docs.opensea.io/reference/stream-api-overview)
- [OpenSea API Reference](https://docs.opensea.io/reference/overview)
- [Stream Event Payloads](https://docs.opensea.io/reference/stream-api-event-example-payloads) 