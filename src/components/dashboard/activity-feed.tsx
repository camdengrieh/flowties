'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Activity, ExternalLink, Filter, RefreshCw } from 'lucide-react';

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

export default function ActivityFeed() {
  const { user } = usePrivy();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventType, setEventType] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [userOnly, setUserOnly] = useState(false);

  const fetchEvents = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        timeRange,
        ...(eventType !== 'all' && { eventType }),
        ...(userOnly && user?.wallet?.address && { userAddress: user.wallet.address })
      });

      const response = await fetch(`/api/events?${params}`);
      const data: EventsResponse = await response.json();
      
      setEvents(data.events);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [eventType, timeRange, userOnly, user?.wallet?.address]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [eventType, timeRange, userOnly]);

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatPrice = (price: string, currency: string) => {
    const num = Number(price) / 1e18;
    return `${num.toFixed(2)} ${currency}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sale': return '💰';
      case 'listing': return '🏷️';
      case 'delisting': return '❌';
      default: return '📝';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'sale': return 'bg-green-100 border-green-300 text-green-800';
      case 'listing': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'delisting': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getEventTitle = (event: Event) => {
    switch (event.type) {
      case 'sale':
        return `NFT #${event.tokenId} sold for ${formatPrice(event.price || '0', event.currency || 'FLOW')}`;
      case 'listing':
        return `NFT #${event.tokenId} listed for ${formatPrice(event.price || '0', event.currency || 'FLOW')}`;
      case 'delisting':
        return `NFT #${event.tokenId} delisted`;
      default:
        return 'Unknown event';
    }
  };

  const getEventDescription = (event: Event) => {
    switch (event.type) {
      case 'sale':
        return `${event.seller?.slice(0, 8)}...${event.seller?.slice(-6)} → ${event.buyer?.slice(0, 8)}...${event.buyer?.slice(-6)}`;
      case 'listing':
        return `Listed by ${event.seller?.slice(0, 8)}...${event.seller?.slice(-6)}`;
      case 'delisting':
        return `Delisted by ${event.seller?.slice(0, 8)}...${event.seller?.slice(-6)}`;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Activity Feed</h2>
          </div>
          <button
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Events</option>
            <option value="sale">Sales</option>
            <option value="listing">Listings</option>
            <option value="delisting">Delistings</option>
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {user?.wallet?.address && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={userOnly}
                onChange={(e) => setUserOnly(e.target.checked)}
                className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700">My activity only</span>
            </label>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity found</p>
            <p className="text-sm text-gray-400 mt-1">
              {userOnly ? 'Try adjusting your filters or check back later' : 'Events will appear here as they happen'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${getEventColor(event.type)}`}>
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {getEventTitle(event)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {getEventDescription(event)}
                        </p>
                        
                        {event.collection && (
                          <div className="flex items-center gap-2 mt-2">
                            <img
                              src={event.collection.image}
                              alt={event.collection.name}
                              className="w-6 h-6 rounded object-cover"
                            />
                            <span className="text-sm text-gray-700 font-medium">
                              {event.collection.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(event.timestamp)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Block #{event.blockNumber}
                          </span>
                          {event.platform && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {event.platform}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => window.open(`https://flowscan.org/transaction/${event.txHash}`, '_blank')}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-3"
                        title="View on Flowscan"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {events.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 text-center">
          <button
            onClick={() => fetchEvents()}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Load more events
          </button>
        </div>
      )}
    </div>
  );
} 