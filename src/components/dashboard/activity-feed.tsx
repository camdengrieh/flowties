"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Activity,
  ExternalLink,
  Filter,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  openSeaStreamService,
  type StreamEvent,
} from "../../lib/opensea-stream";
import Link from "next/link";

interface Event {
  id: string;
  type: "sale" | "listing" | "offer";
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
    rawResponses: {
      collection?: string;
      status?: number;
      error?: string;
      totalEvents?: number;
      hasNext?: boolean;
    }[];
  };
}

export default function ActivityFeed() {
  const { user } = usePrivy();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventType, setEventType] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [userOnly, setUserOnly] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState<StreamEvent[]>([]);
  const [debugInfo, setDebugInfo] = useState<EventsResponse["debug"] | null>(
    null
  );

  // Memoize fetchEvents to prevent unnecessary recreations
  const fetchEvents = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "20",
          timeRange,
          ...(eventType !== "all" && { eventType }),
          ...(userOnly &&
            user?.wallet?.address && { userAddress: user.wallet.address }),
        });

        console.log("🔍 Fetching events with params:", params.toString());
        const response = await fetch(`/api/events?${params}`);
        const data: EventsResponse = await response.json();

        console.log("📊 API Response:", data);
        setEvents(data.events);
        setDebugInfo(data.debug || null);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventType, timeRange, userOnly, user?.wallet?.address]
  );

  // Subscribe to real-time events (only once)
  useEffect(() => {
    const unsubscribe = openSeaStreamService.subscribe(
      "*",
      (event: StreamEvent) => {
        setRealtimeEvents((prev) => {
          // Prevent duplicates and limit to 50 events
          const filtered = prev.filter((e) => e.id !== event.id);
          return [event, ...filtered.slice(0, 49)];
        });
        setStreamConnected(openSeaStreamService.getConnectionStatus());
      }
    );

    // Check initial connection status
    setStreamConnected(openSeaStreamService.getConnectionStatus());

    return unsubscribe;
  }, []); // Empty dependency array - only run once

  // Fetch events when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]); // Only depend on the memoized fetchEvents function

  // Auto-refresh every 30 seconds for historical events
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchEvents]); // Only depend on the memoized fetchEvents function

  // Convert StreamEvent to Event for display
  const convertStreamEvent = useCallback(
    (streamEvent: StreamEvent): Event => ({
      id: streamEvent.id,
      type: streamEvent.type,
      collection: streamEvent.collection
        ? {
            address: streamEvent.collection.address,
            name: streamEvent.collection.name,
            image: streamEvent.collection.image,
          }
        : undefined,
      tokenId: streamEvent.tokenId,
      seller: streamEvent.seller,
      buyer: streamEvent.buyer,
      price: streamEvent.price,
      currency: streamEvent.currency,
      platform: streamEvent.platform,
      timestamp: streamEvent.timestamp,
      txHash: streamEvent.txHash,
      blockNumber: streamEvent.blockNumber,
      image: streamEvent.collection?.image,
      name: undefined,
    }),
    []
  );

  // Combine historical and real-time events with memoization
  const allEvents = useCallback(() => {
    const combined = [...realtimeEvents.map(convertStreamEvent), ...events]
      .filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.id === event.id)
      )
      .filter((event) => {
        // Apply filters
        if (eventType !== "all" && event.type !== eventType) return false;
        if (userOnly && user?.wallet?.address) {
          const userAddress = user.wallet.address.toLowerCase();
          return (
            event.seller?.toLowerCase() === userAddress ||
            event.buyer?.toLowerCase() === userAddress
          );
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    return combined;
  }, [
    realtimeEvents,
    events,
    eventType,
    userOnly,
    user?.wallet?.address,
    convertStreamEvent,
  ]);

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatPrice = (price: string, currency: string) => {
    const num = Number(price) / 1e18;
    return `${num.toFixed(2)} ${currency}`;
  };

  const getEventIcon = (type: string, event: Event) => {
    switch (type) {
      case "sale":
        return event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image}
            className="w-24 h-24 rounded object-cover"
            alt="NFT"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          "💰"
        );
      case "listing":
        return "🏷️";
      case "offer":
        return "💎";
      default:
        return "��";
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getEventColor = (type: string) => {
    switch (type) {
      case "sale":
        return "bg-green-100 border-green-300 text-green-800";
      case "listing":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "offer":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getEventTitle = (event: Event) => {
    switch (event.type) {
      case "sale":
        return `${event.name || `NFT #${event.tokenId}`} sold${
          event.price
            ? ` for ${formatPrice(event.price, event.currency || "ETH")}`
            : ""
        }`;
      case "listing":
        return `${event.name || `NFT #${event.tokenId}`} listed${
          event.price
            ? ` for ${formatPrice(event.price, event.currency || "ETH")}`
            : ""
        }`;
      case "offer":
        return `Offer received on ${event.name || `NFT #${event.tokenId}`}${
          event.price
            ? ` for ${formatPrice(event.price, event.currency || "ETH")}`
            : ""
        }`;
      default:
        return "Unknown event";
    }
  };

  const getEventDescription = (event: Event) => {
    switch (event.type) {
      case "sale":
        return `${event.seller?.slice(0, 8)}...${event.seller?.slice(
          -6
        )} → ${event.buyer?.slice(0, 8)}...${event.buyer?.slice(-6)}`;
      case "listing":
        return `Listed by ${event.seller?.slice(0, 8)}...${event.seller?.slice(
          -6
        )}`;
      case "offer":
        return `Offered by ${event.buyer?.slice(0, 8)}...${event.buyer?.slice(
          -6
        )}`;
      default:
        return "";
    }
  };

  // Get the processed events
  const displayEvents = allEvents();

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
            <h2 className="text-xl font-semibold text-gray-900">
              Activity Feed
            </h2>
            <div className="flex items-center gap-2">
              {streamConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs font-medium">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-500">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs font-medium">Historical</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
            />
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
            <option value="offer">Offers</option>
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
        {displayEvents.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity found</p>
            <p className="text-sm text-gray-400 mt-1">
              {userOnly
                ? "Try adjusting your filters or check back later"
                : "Events will appear here as they happen"}
            </p>

            {/* Debug Information */}
            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-left text-xs">
                <details>
                  <summary className="cursor-pointer font-medium text-gray-700">
                    🔧 Debug Info (Click to expand)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>API Key:</strong>{" "}
                      {debugInfo.apiKey ? "✅ Found" : "❌ Missing"}
                    </div>
                    <div>
                      <strong>Collections Checked:</strong>{" "}
                      {debugInfo.collectionsChecked.join(", ")}
                    </div>
                    <div>
                      <strong>Total API Calls:</strong>{" "}
                      {debugInfo.totalApiCalls}
                    </div>
                    {debugInfo.rawResponses.map((response, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-gray-300 pl-2"
                      >
                        <div>
                          <strong>Collection:</strong> {response.collection}
                        </div>
                        {response.status && (
                          <div>
                            <strong>Status:</strong> {response.status}
                          </div>
                        )}
                        {response.totalEvents !== undefined && (
                          <div>
                            <strong>Total Events:</strong>{" "}
                            {response.totalEvents}
                          </div>
                        )}
                        {response.error && (
                          <div className="text-red-600">
                            <strong>Error:</strong> {response.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayEvents.map((event) => (
              <Link
                key={event.id}
                href={
                  event.collection && event.tokenId
                    ? `/nft/${encodeURIComponent(
                        event.collection.name || event.collection.address
                      )}/${encodeURIComponent(event.tokenId)}`
                    : "#"
                }
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {(() => {
                    const icon = getEventIcon(event.type, event);
                    return typeof icon === "string" ? (
                      <span className="text-lg">{icon}</span>
                    ) : (
                      icon
                    );
                  })()}

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
                            <span className="text-sm text-gray-700 font-medium">
                              {event.collection.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(event.timestamp)}
                          </span>
                          {event.blockNumber && (
                            <span className="text-xs text-gray-500">
                              Block #{event.blockNumber}
                            </span>
                          )}
                          {event.platform && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {event.platform}
                            </span>
                          )}
                          {realtimeEvents.some((re) => re.id === event.id) && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                              Live
                            </span>
                          )}
                        </div>
                      </div>

                      {event.txHash && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `https://flowscan.org/transaction/${event.txHash}`,
                              "_blank"
                            );
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-3"
                          title="View on Flowscan"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {displayEvents.length > 0 && (
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
