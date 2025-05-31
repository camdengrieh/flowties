'use client';

import { useEffect, useState } from "react";
import { ArrowUpRight, Tag, ListPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Event {
  id: string;
  type: "listing" | "offer" | "sale";
  collection: {
    address: string;
    name: string;
    image: string;
  };
  tokenId: string;
  name: string;
  seller?: string;
  buyer?: string;
  price: string;
  currency: string;
  platform: string;
  timestamp: number;
  txHash?: string;
  blockNumber: number;
  image: string;
}

interface Collection {
  slug: string;
  name: string;
  displayName: string;
}

const COLLECTIONS: Collection[] = [
  {
    slug: 'beezie-collectibles',
    name: 'Beezie',
    displayName: 'Beezie Collectibles'
  },
  {
    slug: 'nba-top-shot',
    name: 'NBA Top Shot',
    displayName: 'NBA Top Shot'
  }
];

function EventCard({ event }: { event: Event }) {
  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatPrice = (price: string) => price;

  return (
    <Link
      href={`/nft/${event.collection.name}/${event.tokenId}`}
      className="block bg-gradient-to-br from-gray-800 to-red-900/20 rounded-lg border border-gray-700/50 p-4 hover:border-orange-500/50 transition-all duration-200 hover:bg-gradient-to-br hover:from-gray-700 hover:to-red-800/30"
    >
      <div className="flex items-start gap-3">
        {event.image && (
          <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0 border border-gray-600/50">
            <Image
              src={event.image}
              alt={event.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">
            {event.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-orange-300">
              {formatPrice(event.price)} {event.currency}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <span>{formatTime(event.timestamp)}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500">{event.platform}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ActivityColumn({ title, icon: Icon, events, type }: { 
  title: string;
  icon: React.ElementType;
  events: Event[];
  type: "listing" | "offer" | "sale";
}) {
  return (
    <div className="flex-1 bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg border border-red-900/30 shadow-2xl">
      <div className="px-4 py-3 border-b border-red-900/30">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-orange-400" />
          <h2 className="font-semibold text-white">{title}</h2>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {events.filter(e => e.type === type).map(event => (
            <EventCard key={event.id} event={event} />
          ))}
          {events.filter(e => e.type === type).length === 0 && (
            <div className="text-center py-6 text-gray-400">
              No {type}s yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketActivity() {
  const [events, setEvents] = useState<Event[]>([]);
  const [lowestAsksEvents, setLowestAsksEvents] = useState<Event[]>([]);
  const [recentListingsEvents, setRecentListingsEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string>(COLLECTIONS[0].slug);

  useEffect(() => {
    async function fetchMarketData() {
      setLoading(true);
      let listingsData, allListingsData, offersData;
      
      try {
        const [bestListingsRes, allListingsRes, offersRes] = await Promise.all([
          fetch(`/api/opensea/collection/${selectedCollection}/best-listings`),
          fetch(`/api/opensea/collection/${selectedCollection}/all-listings`),
          fetch(`/api/opensea/collection/${selectedCollection}/best-offers`)
        ]);

        [listingsData, allListingsData, offersData] = await Promise.all([
          bestListingsRes.json(),
          allListingsRes.json(),
          offersRes.json()
        ]);

        const collection = COLLECTIONS.find(c => c.slug === selectedCollection);
        if (!collection) throw new Error('Collection not found');

        // Helper to format price safely
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatPriceModel = (priceModel: any): string => {
          const raw = Number(priceModel?.value ?? 0);
          const dec = priceModel?.decimals ?? 18;
          // If decimals is 0 but the raw value is huge, assume 18
          const divisor = dec === 0 && raw > 1e12 ? Math.pow(10, 18) : Math.pow(10, dec);
          return (raw / divisor).toFixed(4);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapListing = (listing: any): Event => {
          const asset = listing.maker_asset_bundle?.assets?.[0];

          const tokenIdRaw = asset?.token_id || listing.protocol_data?.parameters?.offer?.[0]?.identifierOrCriteria || '0';
          const tokenIdStr = String(tokenIdRaw);

          return {
            id: listing.order_hash,
            type: 'listing',
            collection: {
              address: listing.protocol_data?.parameters?.offer?.[0]?.token || '',
              name: collection.name,
              image: asset?.collection?.image_url || ''
            },
            tokenId: tokenIdStr,
            name: tokenIdStr === '0' ? `${collection.name} (Collection Ask)` : asset?.name || `${collection.name} #${tokenIdStr}`,
            seller: listing.maker?.address,
            price: formatPriceModel(listing.price.current),
            currency: listing.price.current?.currency || 'ETH',
            platform: 'OpenSea',
            timestamp: listing.listing_time || Math.floor(new Date(listing.created_date || new Date()).getTime() / 1000),
            blockNumber: 0,
            image: asset?.image_url || asset?.collection?.image_url || '/placeholder.png'
          };
        };

        const lowestAsksAll: Event[] = (listingsData.listings || []).map(mapListing);

        const recentAllListings: Event[] = (allListingsData.listings || []).map(mapListing);

        // Filter recent listings to exclude ones already in lowest asks (by id)
        const lowestIds = new Set(lowestAsksAll.map((e) => e.id));
        const latestListings = recentAllListings
          .filter((e) => !lowestIds.has(e.id))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);

        // Derive lowest asks (already sorted by API as cheapest) just slice 5
        const lowestAsks = lowestAsksAll.slice(0, 5);

        const mappedOffers: Event[] = (offersData.offers || []).map(
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ 
            (offer: any) => {
          const asset = offer.taker_asset_bundle?.assets?.[0];

          const displayPrice = formatPriceModel(offer.price.current);

          return {
            id: offer.order_hash,
            type: 'offer',
            collection: {
              address: offer.protocol_data?.parameters?.offer?.token || '',
              name: collection.name,
              image: asset?.collection?.image_url || ''
            },
            tokenId: asset?.token_id || offer.protocol_data?.parameters?.offer?.identifierOrCriteria || 'unknown',
            name: asset?.name || `${collection.name} #${asset?.token_id ?? '??'}`,
            buyer: offer.maker?.address,
            price: displayPrice,
            currency: offer.price.current?.currency || 'ETH',
            platform: 'OpenSea',
            timestamp: new Date(offer.created_date).getTime() / 1000,
            blockNumber: 0,
            image: asset?.image_url || asset?.collection?.image_url || '/placeholder.png'
          };
        });

        // Fetch metadata for all events to enrich images & names
        const allEventsForMeta = [...lowestAsks, ...latestListings, ...mappedOffers];
        const tokensPayload = allEventsForMeta.map((e) => ({
          contractAddress: e.collection.address,
          tokenId: e.tokenId
        }));

        try {
          const metaRes = await fetch('/api/opensea/metadata-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokens: tokensPayload })
          });

          if (metaRes.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const metadataArray = await metaRes.json() as any[];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const metaMap: Map<string, any> = new Map();
            metadataArray.forEach((meta) => {
              const key = `${meta.contract?.address?.toLowerCase() || ''}-${meta.tokenId}`;
              metaMap.set(key, meta);
            });

            const patchEvent = (event: Event): Event => {
              const key = `${event.collection.address.toLowerCase()}-${event.tokenId}`;
              const meta = metaMap.get(key);
              if (meta) {
                // Support both OpenSea and Alchemy response shapes
                const imageUrl =
                  meta.nft?.image_url ||
                  meta.image_url ||
                  meta.image?.cachedUrl ||
                  meta.image?.pngUrl ||
                  meta.image?.thumbnailUrl ||
                  meta.image?.originalUrl;

                const displayName =
                  meta.nft?.name || meta.name || event.name;

                return {
                  ...event,
                  image: event.image || imageUrl || event.image,
                  name: !event.name || event.name.includes('Collection Ask') ? displayName : event.name
                };
              }
              return event;
            };

            const offersPatched = mappedOffers.map(patchEvent);
            const lowestPatched = lowestAsks.map(patchEvent);
            const latestPatched = latestListings.map(patchEvent);

            setEvents(offersPatched);
            setLowestAsksEvents(lowestPatched);
            setRecentListingsEvents(latestPatched);
          } else {
            // fallback to existing events if metadata call fails
            setEvents(mappedOffers);
            setLowestAsksEvents(lowestAsks);
            setRecentListingsEvents(latestListings);
          }
        } catch (metaErr) {
          console.error('Failed to fetch metadata batch:', metaErr);
          setEvents(mappedOffers);
          setLowestAsksEvents(lowestAsks);
          setRecentListingsEvents(latestListings);
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        console.log('Listings Response:', listingsData);
        console.log('All Listings Response:', allListingsData);
        console.log('Offers Response:', offersData);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [selectedCollection]);

  return (
    <div className="space-y-6">
      {/* Collection Tabs */}
      <div className="border-b border-red-900/30">
        <nav className="-mb-px flex space-x-8" aria-label="Collections">
          {COLLECTIONS.map((collection) => (
            <button
              key={collection.slug}
              onClick={() => setSelectedCollection(collection.slug)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${selectedCollection === collection.slug
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-orange-300 hover:border-orange-500/50'
                }
              `}
            >
              {collection.displayName}
            </button>
          ))}
        </nav>
      </div>

      {/* Market Activity Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg border border-red-900/30 shadow-2xl p-4">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-20 bg-gray-800 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActivityColumn 
            title="Highest Offers" 
            icon={ArrowUpRight}
            events={events}
            type="offer"
          />
          <ActivityColumn 
            title="Lowest Asks" 
            icon={Tag}
            events={lowestAsksEvents}
            type="listing"
          />
          <ActivityColumn 
            title="New Listings" 
            icon={ListPlus}
            events={recentListingsEvents}
            type="listing"
          />
        </div>
      )}
    </div>
  );
} 