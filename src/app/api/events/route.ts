import { NextRequest, NextResponse } from 'next/server';

interface Event {
  id: string;
  type: 'sale' | 'listing' | 'offer';
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
  image?: string;
  name?: string;
}

interface DebugResponse {
  collection?: string;
  status?: number;
  error?: string;
  totalEvents?: number;
  hasNext?: boolean;
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
  debug?: {
    apiKey: boolean;
    collectionsChecked: string[];
    totalApiCalls: number;
    rawResponses: DebugResponse[];
  };
}

// OpenSea API response types
interface OpenSeaEvent {
  id?: string;
  event_type: string;
  event_timestamp: string;
  asset?: {
    token_id?: string;
    name?: string;
    collection?: {
      address?: string;
      name?: string;
      image_url?: string;
    };
  };
  seller?: {
    address?: string;
  } | string;
  buyer?: {
    address?: string;
  } | string;
  from_account?: {
    address?: string;
  };
  winner_account?: {
    address?: string;
  };
  to_account?: {
    address?: string;
  };
  payment_token?: {
    symbol?: string;
  };
  payment?: {
    amount?: string;
    quantity?: string;
    symbol?: string;
    token?: {
      symbol?: string;
    };
  };
  total_price?: string;
  sale_price?: string;
  item?: {
    nft_id?: string;
  };
  maker?: {
    address?: string;
  };
  transaction?: {
    transaction_hash?: string;
    hash?: string;
    block_number?: number;
    block?: number;
  };
  nft?: {
    identifier?: string;
    collection?: string;
    contract?: string;
    image_url?: string;
    display_image_url?: string;
    display_animation_url?: string;
    name?: string;
  };
  from_address?: string;
  to_address?: string;
}

interface OpenSeaEventsResponse {
  asset_events?: OpenSeaEvent[];
  next?: string | null;
}

// Target collections we want to monitor
const TARGET_COLLECTIONS = [
  'beezie-collectibles',  // BeezieCollectibles
  'nba-top-shot'          // NBA TopShot
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const eventType = searchParams.get('eventType');
  const collection = searchParams.get('collection');
  const userAddress = searchParams.get('userAddress');
  const timeRange = searchParams.get('timeRange') || '24h';

  console.log('🔍 Events API called with params:', {
    page, limit, eventType, collection, userAddress, timeRange
  });

  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
    if (!apiKey) {
      console.error('❌ OpenSea API key not configured');
      throw new Error('OpenSea API key not configured');
    }
    console.log('✅ OpenSea API key found');

    // Calculate time filter
    const now = Math.floor(Date.now() / 1000);
    let occurredAfter = 0;
    
    switch (timeRange) {
      case '1h':
        occurredAfter = now - 3600;
        break;
      case '6h':
        occurredAfter = now - 21600;
        break;
      case '24h':
        occurredAfter = now - 86400;
        break;
      case '7d':
        occurredAfter = now - 604800;
        break;
      case '30d':
        occurredAfter = now - 2592000;
        break;
      default:
        occurredAfter = now - 86400;
    }

    console.log(`🕐 Time filter: Events after ${new Date(occurredAfter * 1000).toISOString()}`);

    // Determine which collections to fetch from
    const collectionsToFetch = collection && TARGET_COLLECTIONS.includes(collection) 
      ? [collection] 
      : TARGET_COLLECTIONS;

    console.log('📦 Collections to fetch:', collectionsToFetch);

    const allEvents: Event[] = [];
    const debugInfo = {
      apiKey: true,
      collectionsChecked: collectionsToFetch,
      totalApiCalls: 0,
      rawResponses: [] as DebugResponse[]
    };

    // Fetch events for each target collection
    for (const collectionSlug of collectionsToFetch) {
      try {
        debugInfo.totalApiCalls++;
        
        // Build OpenSea API parameters
        const params = new URLSearchParams();
        params.append('limit', Math.ceil(limit / collectionsToFetch.length).toString());
        params.append('occurred_after', occurredAfter.toString());
        
        if (eventType && eventType !== 'all') {
          // Map our event types to OpenSea event types (only support sales, listings, offers)
          const openSeaEventTypes = {
            'sale': 'sale',
            'listing': 'listing',
            'offer': 'offer'
          };
          const mappedEventType = openSeaEventTypes[eventType as keyof typeof openSeaEventTypes];
          if (mappedEventType) {
            params.append('event_type', mappedEventType);
          }
        }

        if (userAddress) {
          params.append('account_address', userAddress);
        }

        // Specify Flow chain explicitly
        params.append('chain_identifier', 'FLOW');

        // Call OpenSea Events API for this collection
        const openSeaUrl = `https://api.opensea.io/api/v2/events/collection/${collectionSlug}?${params.toString()}`;
        
        console.log(`🌐 Fetching OpenSea events for ${collectionSlug}:`, openSeaUrl);
        
        const response = await fetch(openSeaUrl, {
          headers: {
            'X-API-KEY': apiKey,
            'Accept': 'application/json'
          }
        });

        console.log(`📡 Response status for ${collectionSlug}:`, response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`❌ OpenSea API returned ${response.status} for ${collectionSlug}:`, errorText);
          debugInfo.rawResponses.push({
            collection: collectionSlug,
            status: response.status,
            error: errorText
          });
          
          // If collection not found, let's try different collection slugs
          if (response.status === 404) {
            console.log(`🔍 Collection '${collectionSlug}' not found. This might be the wrong slug.`);
            console.log(`💡 Try checking OpenSea directly: https://opensea.io/collection/${collectionSlug}`);
          }
          
          continue; // Skip this collection and continue with others
        }

        const data: OpenSeaEventsResponse = await response.json();
        
        // Log the complete raw response to understand the structure
        console.log(`📊 Complete raw OpenSea response for ${collectionSlug}:`, data);
        
        console.log(`📊 Raw data summary for ${collectionSlug}:`, {
          totalEvents: data.asset_events?.length || 0,
          hasNext: !!data.next,
          sampleEvent: data.asset_events?.[0] || 'No events',
          fullSampleEvent: JSON.stringify(data.asset_events?.[0], null, 2)
        });
        
        debugInfo.rawResponses.push({
          collection: collectionSlug,
          status: 200,
          totalEvents: data.asset_events?.length || 0,
          hasNext: !!data.next
        });
        
        // If no events, log why
        if (!data.asset_events || data.asset_events.length === 0) {
          console.log(`⚠️ No events found for ${collectionSlug}. This could mean:`);
          console.log(`  1. Collection has no recent activity`);
          console.log(`  2. Collection slug is incorrect`);
          console.log(`  3. Time range is too restrictive`);
          console.log(`  4. OpenSea API is filtering results`);
          continue;
        }
        
        // Transform OpenSea events to our format (only sales, listings, offers)
        const events: Event[] = data.asset_events?.map((event: OpenSeaEvent) => {
          console.log(`🔄 Transforming event for ${collectionSlug}:`, JSON.stringify(event, null, 2));
          
          const sellerAddress = typeof event.seller === 'string' ? event.seller : (event.seller?.address);
          const buyerAddress = typeof event.buyer === 'string' ? event.buyer : (event.buyer?.address);
          const fromAddr = event.from_address || event.from_account?.address;
          const toAddr = event.to_address || event.to_account?.address;
          const seller = sellerAddress || fromAddr || event.maker?.address;
          const buyer = buyerAddress || toAddr || event.winner_account?.address;
          const rawPrice = event.payment?.quantity || event.total_price || event.sale_price;
          const price = rawPrice ? rawPrice.toString() : undefined;
          const currencySym = event.payment?.symbol || event.payment_token?.symbol || event.payment?.token?.symbol || 'FLOW';
          const timestampSec = Number(event.event_timestamp);

          const transformedEvent: Event = {
            id: event.id || `${event.event_type}_${event.event_timestamp}_${Math.random()}`,
            type: event.event_type as Event['type'],
            collection: event.nft ? {
              address: event.nft.contract || '',
              name: event.nft.collection || 'Unknown Collection',
              image: event.nft.image_url || event.nft.display_image_url || ''
            } : event.asset?.collection ? {
              address: event.asset.collection.address || '',
              name: event.asset.collection.name || 'Unknown Collection',
              image: event.asset.collection.image_url || ''
            } : undefined,
            tokenId: event.nft?.identifier || event.asset?.token_id || event.item?.nft_id,
            name: event.nft?.name || event.asset?.name,
            seller,
            buyer,
            price,
            currency: currencySym,
            platform: 'OpenSea',
            timestamp: timestampSec > 1e12 ? Math.floor(timestampSec / 1000) : timestampSec, // handle seconds vs ms
            txHash: typeof event.transaction === 'string' ? event.transaction : (event.transaction?.transaction_hash || event.transaction?.hash || ''),
            blockNumber: event.transaction?.block_number || event.transaction?.block || 0,
            image: event.nft?.display_image_url || event.nft?.image_url || ''
          };
          
          console.log(`✅ Transformed event for ${collectionSlug}:`, transformedEvent);
          return transformedEvent;
        }).filter((event: Event) => event.type && ['sale', 'listing', 'offer'].includes(event.type)) || [];

        console.log(`✅ Processed ${events.length} events for ${collectionSlug}`);
        allEvents.push(...events);
      } catch (collectionError) {
        console.error(`💥 Error fetching events for ${collectionSlug}:`, collectionError);
        debugInfo.rawResponses.push({
          collection: collectionSlug,
          error: collectionError instanceof Error ? collectionError.message : 'Unknown error'
        });
        // Continue with other collections
      }
    }

    // Sort all events by timestamp (most recent first) and apply limit
    const sortedEvents = allEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    console.log(`🎯 Final result: ${sortedEvents.length} events out of ${allEvents.length} total`);

    const responseData: EventsResponse = {
      events: sortedEvents,
      pagination: {
        page,
        limit,
        total: sortedEvents.length,
        hasMore: allEvents.length > limit
      },
      filters: {
        eventType: eventType || undefined,
        collection: collection || undefined,
        userAddress: userAddress || undefined,
        timeRange
      },
      debug: debugInfo
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('💥 Error fetching OpenSea events:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch events from OpenSea API',
        events: [],
        pagination: { page, limit, total: 0, hasMore: false },
        filters: { timeRange },
        debug: {
          apiKey: false,
          collectionsChecked: TARGET_COLLECTIONS,
          totalApiCalls: 0,
          rawResponses: [{
            error: error instanceof Error ? error.message : 'Unknown error'
          }]
        }
      },
      { status: 500 }
    );
  }
}