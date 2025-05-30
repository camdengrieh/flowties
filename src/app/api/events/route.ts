import { NextRequest, NextResponse } from 'next/server';

// Type definitions for API responses
interface Sale {
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

interface Offer {
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

interface Cancellation {
  id: string;
  offerer: string;
  timestamp: number;
  blockNumber: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
}

interface Event {
  id: string;
  type: 'sale' | 'listing' | 'delisting';
  collection?: string;
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

// GraphQL query for fetching events from Ponder
const EVENTS_QUERY = `
  query GetEvents($timeFilter: Int!, $limit: Int!, $offset: Int!) {
    sales(
      where: { timestamp_gte: $timeFilter }
      orderBy: timestamp
      orderDirection: desc
      first: $limit
      skip: $offset
    ) {
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
    offers(
      where: { 
        timestamp_gte: $timeFilter
        status: "active"
      }
      orderBy: timestamp
      orderDirection: desc
      first: $limit
      skip: $offset
    ) {
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
    cancellations(
      where: { timestamp_gte: $timeFilter }
      orderBy: timestamp
      orderDirection: desc
      first: $limit
      skip: $offset
    ) {
      id
      offerer
      timestamp
      blockNumber
    }
    collections {
      id
      name
      symbol
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const eventType = searchParams.get('eventType');
    const collection = searchParams.get('collection');
    const userAddress = searchParams.get('userAddress');
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calculate time range filter
    const now = Math.floor(Date.now() / 1000);
    let timeRangeSeconds = 24 * 60 * 60; // 24h default
    
    switch (timeRange) {
      case '1h': timeRangeSeconds = 60 * 60; break;
      case '6h': timeRangeSeconds = 6 * 60 * 60; break;
      case '24h': timeRangeSeconds = 24 * 60 * 60; break;
      case '7d': timeRangeSeconds = 7 * 24 * 60 * 60; break;
      case '30d': timeRangeSeconds = 30 * 24 * 60 * 60; break;
    }

    const timeFilter = now - timeRangeSeconds;
    const offset = (page - 1) * limit;

    // Query Ponder GraphQL endpoint
    const ponderResponse = await fetch('http://localhost:42070/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: EVENTS_QUERY,
        variables: {
          timeFilter,
          limit,
          offset
        }
      })
    });

    if (!ponderResponse.ok) {
      throw new Error(`Ponder request failed: ${ponderResponse.status}`);
    }

    const ponderData = await ponderResponse.json();
    
    if (ponderData.errors) {
      console.error('Ponder GraphQL errors:', ponderData.errors);
      throw new Error('Ponder GraphQL query failed');
    }

    let events: Event[] = [];

    // Process sales events
    if (!eventType || eventType === 'sale') {
      const sales = ponderData.data.sales || [];
      events.push(...sales.map((sale: Sale) => ({
        ...sale,
        type: 'sale' as const,
        txHash: sale.id.split('-')[0], // Extract tx hash from id
      })));
    }

    // Process listing events (from offers)
    if (!eventType || eventType === 'listing') {
      const offers = ponderData.data.offers || [];
      events.push(...offers.map((offer: Offer) => ({
        id: offer.id,
        type: 'listing' as const,
        collection: offer.collection,
        tokenId: offer.tokenId,
        seller: offer.offerer,
        price: offer.price,
        currency: offer.currency,
        platform: offer.platform,
        timestamp: offer.timestamp,
        txHash: offer.id.split('-')[0], // Extract tx hash from id
        blockNumber: offer.blockNumber,
      })));
    }

    // Process delisting events (from cancellations)
    if (!eventType || eventType === 'delisting') {
      const cancellations = ponderData.data.cancellations || [];
      events.push(...cancellations.map((cancellation: Cancellation) => ({
        id: cancellation.id,
        type: 'delisting' as const,
        seller: cancellation.offerer,
        timestamp: cancellation.timestamp,
        txHash: cancellation.id.split('-')[0], // Extract tx hash from id
        blockNumber: cancellation.blockNumber,
      })));
    }

    // Apply additional filters
    if (collection) {
      events = events.filter(event => 
        event.collection && (
          event.collection.toLowerCase().includes(collection.toLowerCase()) ||
          event.collection === collection
        )
      );
    }

    if (userAddress) {
      events = events.filter(event => 
        (event.seller && event.seller.toLowerCase() === userAddress.toLowerCase()) ||
        (event.buyer && event.buyer.toLowerCase() === userAddress.toLowerCase()) ||
        (event.seller && event.seller.toLowerCase() === userAddress.toLowerCase()) // offerer mapped to seller
      );
    }

    // Sort all events by timestamp and apply pagination
    events.sort((a, b) => b.timestamp - a.timestamp);
    const paginatedEvents = events.slice(0, limit);

    // Enrich events with collection metadata
    const collections = ponderData.data.collections || [];
    const enrichedEvents = paginatedEvents.map(event => {
      const collectionData = collections.find((c: Collection) => c.id === event.collection);
      return {
        ...event,
        collection: event.collection ? {
          address: event.collection,
          name: collectionData?.name || 'Unknown Collection',
          image: 'https://via.placeholder.com/64' // You'd fetch this from IPFS/metadata
        } : undefined
      };
    });

    return NextResponse.json({
      events: enrichedEvents,
      pagination: {
        page,
        limit,
        total: events.length,
        hasMore: events.length >= limit
      },
      filters: {
        eventType,
        collection,
        userAddress,
        timeRange
      }
    });

  } catch (error) {
    console.error('Events API error:', error);
    
    // Fallback to empty data if Ponder is not available
    return NextResponse.json({
      events: [],
      pagination: {
        page: parseInt(new URL(request.url).searchParams.get('page') || '1'),
        limit: parseInt(new URL(request.url).searchParams.get('limit') || '20'),
        total: 0,
        hasMore: false
      },
      filters: {
        eventType: new URL(request.url).searchParams.get('eventType'),
        collection: new URL(request.url).searchParams.get('collection'),
        userAddress: new URL(request.url).searchParams.get('userAddress'),
        timeRange: new URL(request.url).searchParams.get('timeRange') || '24h'
      },
      error: 'Ponder backend not available - showing empty results'
    });
  }
} 