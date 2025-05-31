import { NextRequest, NextResponse } from 'next/server';

interface Event {
  id: string;
  type: 'sale' | 'listing' | 'delisting';
  collection?: {
    address: string;
    name: string;
    image: string;
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
}

interface EventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    eventType?: string;
    collection?: string;
    userAddress?: string;
    timeRange: string;
  };
  error?: string;
}

interface CollectionData {
  id: string;
  name: string;
  symbol: string;
  totalVolume: string;
  owners: number;
}

interface SaleData {
  id: string;
  collection: string;
  tokenId: string;
  seller: string;
  buyer: string;
  price: string;
  currency: string;
  platform: string;
  timestamp: number;
  blockNumber: string;
}

interface OfferData {
  id: string;
  collection: string;
  tokenId: string;
  offerer: string;
  price: string;
  currency: string;
  platform: string;
  timestamp: number;
  blockNumber: string;
}

interface CancellationData {
  id: string;
  offerer: string;
  timestamp: number;
  blockNumber: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const eventType = searchParams.get('eventType');
  const collection = searchParams.get('collection');
  const userAddress = searchParams.get('userAddress');
  const timeRange = searchParams.get('timeRange') || '24h';

  try {
    // Calculate time filter
    const now = Math.floor(Date.now() / 1000);
    let timestampFilter = 0;
    
    switch (timeRange) {
      case '1h':
        timestampFilter = now - 3600;
        break;
      case '6h':
        timestampFilter = now - 21600;
        break;
      case '24h':
        timestampFilter = now - 86400;
        break;
      case '7d':
        timestampFilter = now - 604800;
        break;
      case '30d':
        timestampFilter = now - 2592000;
        break;
      default:
        timestampFilter = now - 86400;
    }

    const skip = (page - 1) * limit;

    // Build GraphQL query using correct Ponder syntax
    let salesQuery = '';
    let offersQuery = '';
    let cancellationsQuery = '';

    // Sales (completed transactions)
    if (!eventType || eventType === 'sale') {
      salesQuery = `
        sales(
          limit: ${limit}
          offset: ${skip}
          orderBy: "timestamp"
          orderDirection: "desc"
          where: { 
            timestamp: { gte: ${timestampFilter} }
            ${collection ? `collection: "${collection}"` : ''}
            ${userAddress ? `or: [{ seller: "${userAddress}" }, { buyer: "${userAddress}" }]` : ''}
          }
        ) {
          items {
            id
            collection
            tokenId
            seller
            buyer
            price
            currency
            platform
            timestamp
            blockNumber
          }
        }
      `;
    }

    // Offers/Listings
    if (!eventType || eventType === 'listing') {
      offersQuery = `
        offers(
          limit: ${limit}
          offset: ${skip}
          orderBy: "timestamp"
          orderDirection: "desc"
          where: { 
            timestamp: { gte: ${timestampFilter} }
            status: "active"
            ${collection ? `collection: "${collection}"` : ''}
            ${userAddress ? `offerer: "${userAddress}"` : ''}
          }
        ) {
          items {
            id
            collection
            tokenId
            offerer
            price
            currency
            platform
            timestamp
            blockNumber
          }
        }
      `;
    }

    // Cancellations (delistings)
    if (!eventType || eventType === 'delisting') {
      cancellationsQuery = `
        cancellations(
          limit: ${limit}
          offset: ${skip}
          orderBy: "timestamp"
          orderDirection: "desc"
          where: { 
            timestamp: { gte: ${timestampFilter} }
            ${userAddress ? `offerer: "${userAddress}"` : ''}
          }
        ) {
          items {
            id
            offerer
            timestamp
            blockNumber
          }
        }
      `;
    }

    // Get collection metadata
    const collectionsQuery = `
      collections {
        items {
          id
          name
          symbol
          totalVolume
          owners
        }
      }
    `;

    const query = `
      query GetEvents {
        ${salesQuery}
        ${offersQuery}
        ${cancellationsQuery}
        ${collectionsQuery}
      }
    `;

    console.log('Executing Ponder GraphQL query:', query);

    const ponderResponse = await fetch('http://localhost:42070/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!ponderResponse.ok) {
      throw new Error(`Ponder API returned ${ponderResponse.status}`);
    }

    const ponderData = await ponderResponse.json();
    
    if (ponderData.errors) {
      console.error('Ponder GraphQL errors:', ponderData.errors);
      throw new Error('Ponder GraphQL query failed');
    }

    const events: Event[] = [];
    const collections: CollectionData[] = ponderData.data.collections?.items || [];
    
    // Create collection map for metadata lookup
    const collectionMap = new Map(
      collections.map((c: CollectionData) => [
        c.id, 
        { 
          address: c.id, 
          name: c.name || 'Unknown Collection',
          image: 'https://via.placeholder.com/64' // Placeholder - can be enriched with readContract
        }
      ])
    );

    // Process sales
    if (ponderData.data.sales?.items) {
      const salesEvents = ponderData.data.sales.items.map((sale: SaleData) => ({
        id: sale.id,
        type: 'sale' as const,
        collection: collectionMap.get(sale.collection),
        tokenId: sale.tokenId,
        seller: sale.seller,
        buyer: sale.buyer,
        price: sale.price,
        currency: sale.currency,
        platform: sale.platform || 'FlowtyMarketplace',
        timestamp: sale.timestamp,
        txHash: sale.id.split('-')[0], // Extract tx hash from id
        blockNumber: sale.blockNumber
      }));
      events.push(...salesEvents);
    }

    // Process listings (offers)
    if (ponderData.data.offers?.items) {
      const listingEvents = ponderData.data.offers.items.map((offer: OfferData) => ({
        id: offer.id,
        type: 'listing' as const,
        collection: collectionMap.get(offer.collection),
        tokenId: offer.tokenId,
        seller: offer.offerer,
        buyer: undefined,
        price: offer.price,
        currency: offer.currency,
        platform: offer.platform || 'FlowtyMarketplace',
        timestamp: offer.timestamp,
        txHash: offer.id.split('-')[0],
        blockNumber: offer.blockNumber
      }));
      events.push(...listingEvents);
    }

    // Process cancellations (delistings)
    if (ponderData.data.cancellations?.items) {
      const cancellationEvents = ponderData.data.cancellations.items.map((cancellation: CancellationData) => ({
        id: cancellation.id,
        type: 'delisting' as const,
        collection: undefined,
        tokenId: undefined,
        seller: cancellation.offerer,
        buyer: undefined,
        price: undefined,
        currency: undefined,
        platform: 'FlowtyMarketplace',
        timestamp: cancellation.timestamp,
        txHash: cancellation.id.split('-')[0],
        blockNumber: cancellation.blockNumber
      }));
      events.push(...cancellationEvents);
    }

    // Sort events by timestamp (most recent first)
    events.sort((a, b) => b.timestamp - a.timestamp);

    // Paginate results
    const totalEvents = events.length;
    const paginatedEvents = events.slice(0, limit);

    const response: EventsResponse = {
      events: paginatedEvents,
      pagination: {
        page,
        limit,
        total: totalEvents,
        hasMore: totalEvents > page * limit
      },
      filters: {
        eventType: eventType || undefined,
        collection: collection || undefined,
        userAddress: userAddress || undefined,
        timeRange
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Events API error:', error);
    
    // Return empty results on error instead of failing
    const fallbackResponse: EventsResponse = {
      events: [],
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false
      },
      filters: {
        eventType: eventType || undefined,
        collection: collection || undefined,
        userAddress: userAddress || undefined,
        timeRange
      },
      error: 'Failed to fetch events from blockchain indexer'
    };

    return NextResponse.json(fallbackResponse);
  }
} 