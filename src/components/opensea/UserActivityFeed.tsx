'use client';

import { useState, useEffect } from 'react';
import { User, ExternalLink, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface OpenSeaEvent {
  event_type: string;
  order_hash: string;
  nft: {
    identifier: string;
    collection: string;
    contract: string;
    name: string;
    image_url: string;
  };
  quantity: number;
  seller: string;
  buyer: string;
  payment: {
    quantity: string;
    token_address: string;
    decimals: number;
    symbol: string;
  };
  event_timestamp: string;
  transaction: string;
}

interface UserProfile {
  address: string;
  username?: string;
  profile_img_url?: string;
  banner_img_url?: string;
  bio?: string;
  social_media_accounts?: Array<{
    platform: string;
    username: string;
  }>;
}

interface UserActivityFeedProps {
  address: string;
  className?: string;
  limit?: number;
}

export function UserActivityFeed({ 
  address, 
  className = "",
  limit = 20 
}: UserActivityFeedProps) {
  const [events, setEvents] = useState<OpenSeaEvent[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user events and profile in parallel
        const [eventsResponse, profileResponse] = await Promise.all([
          fetch(`/api/opensea/accounts/${address}/events?limit=${limit}&chain=flow`),
          fetch(`/api/opensea/accounts/${address}`)
        ]);

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData.asset_events || []);
        }

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, limit]);

  const formatPrice = (payment: { quantity: string; token_address: string; decimals: number; symbol: string } | null) => {
    if (!payment) return 'N/A';
    const amount = parseFloat(payment.quantity) / Math.pow(10, payment.decimals);
    return `${amount.toFixed(4)} ${payment.symbol}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'sale':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'offer':
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      case 'transfer':
        return <ExternalLink className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'sale':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'offer':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'transfer':
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'border-l-gray-300 bg-white dark:bg-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* User Profile Header */}
      {profile && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {profile.profile_img_url ? (
                <img 
                  src={profile.profile_img_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {profile.username || `${address.slice(0, 8)}...${address.slice(-6)}`}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {address}
              </p>
              {profile.bio && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h4>
        
        {error && (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            <p>Failed to load activity feed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!error && events.length === 0 && (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity found</p>
          </div>
        )}

        <div className="space-y-4">
          {events.map((event, index) => (
            <div 
              key={`${event.transaction}-${index}`}
              className={`border-l-4 pl-4 py-3 rounded-r-lg ${getEventColor(event.event_type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getEventIcon(event.event_type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {event.event_type}
                      </span>
                      {event.nft.name && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {event.nft.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span>Token #{event.nft.identifier}</span>
                      {event.payment && (
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formatPrice(event.payment)}
                        </span>
                      )}
                    </div>

                    {event.event_type === 'sale' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {event.seller === address ? 'Sold to' : 'Bought from'} {' '}
                        {event.seller === address 
                          ? `${event.buyer.slice(0, 6)}...${event.buyer.slice(-4)}`
                          : `${event.seller.slice(0, 6)}...${event.seller.slice(-4)}`
                        }
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(event.event_timestamp)}
                  </div>
                  {event.transaction && (
                    <a
                      href={`https://flowscan.org/tx/${event.transaction}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Tx
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length > 0 && (
          <div className="mt-6 text-center">
            <button className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
              Load More Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 