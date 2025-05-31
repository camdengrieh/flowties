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

  const formatPrice = (price: string) => {
    return (Number(price) / 1e18).toFixed(4);
  };

  return (
    <Link
      href={`/nft/${event.collection.name}/${event.tokenId}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        {event.image && (
          <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={event.image}
              alt={event.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {event.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-gray-900">
              {formatPrice(event.price)} {event.currency}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{formatTime(event.timestamp)}</span>
            <span className="text-gray-300">•</span>
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
    <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {events.filter(e => e.type === type).map(event => (
            <EventCard key={event.id} event={event} />
          ))}
          {events.filter(e => e.type === type).length === 0 && (
            <div className="text-center py-6 text-gray-500">
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
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string>(COLLECTIONS[0].slug);

  useEffect(() => {
    async function fetchMarketData() {
      setLoading(true);
      let listingsData, offersData;
      
      try {
        const [listingsRes, offersRes] = await Promise.all([
          fetch(`/api/opensea/collection/${selectedCollection}/best-listings`),
          fetch(`/api/opensea/collection/${selectedCollection}/best-offers`)
        ]);

        [listingsData, offersData] = await Promise.all([
          listingsRes.json(),
          offersRes.json()
        ]);

        const collection = COLLECTIONS.find(c => c.slug === selectedCollection);
        if (!collection) throw new Error('Collection not found');

        const mappedListings: Event[] = (listingsData.listings || []).slice(0, 5).map((listing: any) => {
          const asset = listing.maker_asset_bundle?.assets?.[0];
          return {
            id: listing.order_hash,
            type: 'listing',
            collection: {
              address: listing.protocol_data?.parameters?.consideration?.[0]?.token || '',
              name: collection.name,
              image: asset?.collection?.image_url || ''
            },
            tokenId: listing.protocol_data?.parameters?.consideration?.[0]?.identifierOrCriteria || 'unknown',
            name: asset?.name || `${collection.name} #${listing.protocol_data?.parameters?.consideration?.[0]?.identifierOrCriteria}`,
            seller: listing.maker?.address,
            price: listing.price.current.value,
            currency: listing.price.current.currency.symbol,
            platform: 'OpenSea',
            timestamp: new Date(listing.created_date).getTime() / 1000,
            blockNumber: 0,
            image: asset?.image_url || ''
          };
        });

        const mappedOffers: Event[] = (offersData.offers || []).slice(0, 5).map((offer: any) => {
          const asset = offer.taker_asset_bundle?.assets?.[0];
          return {
            id: offer.order_hash,
            type: 'offer',
            collection: {
              address: offer.protocol_data?.parameters?.offer?.token || '',
              name: collection.name,
              image: asset?.collection?.image_url || ''
            },
            tokenId: offer.protocol_data?.parameters?.offer?.identifierOrCriteria || 'unknown',
            name: asset?.name || `${collection.name} #${offer.protocol_data?.parameters?.offer?.identifierOrCriteria}`,
            buyer: offer.maker?.address,
            price: offer.price.current.value,
            currency: offer.price.current.currency.symbol,
            platform: 'OpenSea',
            timestamp: new Date(offer.created_date).getTime() / 1000,
            blockNumber: 0,
            image: asset?.image_url || ''
          };
        });

        setEvents([...mappedListings, ...mappedOffers]);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        console.log('Listings Response:', listingsData);
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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Collections">
          {COLLECTIONS.map((collection) => (
            <button
              key={collection.slug}
              onClick={() => setSelectedCollection(collection.slug)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${selectedCollection === collection.slug
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-20 bg-gray-100 rounded"></div>
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
            events={events}
            type="listing"
          />
          <ActivityColumn 
            title="New Listings" 
            icon={ListPlus}
            events={events}
            type="sale"
          />
        </div>
      )}
    </div>
  );
} 