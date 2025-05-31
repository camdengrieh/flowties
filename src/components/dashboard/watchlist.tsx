'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Plus, Trash2, Users, Image, Wallet, Bell } from 'lucide-react';

interface WatchlistItem {
  id: string;
  userPrivyId: string;
  type: 'collection' | 'user' | 'nft';
  target: string;
  metadata?: {
    name?: string;
    image?: string;
    floorPrice?: string;
    volume24h?: string;
    owners?: number;
    alias?: string;
    totalVolume?: string;
    nftsOwned?: number;
    lastActivity?: number;
    collection?: string;
    tokenId?: string;
    lastSalePrice?: string;
    currentOwner?: string;
  };
  notifications?: Record<string, boolean>;
  addedAt: number;
}

interface WatchlistData {
  collections?: WatchlistItem[];
  users?: WatchlistItem[];
  nfts?: WatchlistItem[];
}

export default function Watchlist() {
  const { ready, authenticated, user } = usePrivy();
  const [watchlistData, setWatchlistData] = useState<WatchlistData>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'collections' | 'users' | 'nfts'>('collections');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemAddress, setNewItemAddress] = useState('');
  const [newItemType, setNewItemType] = useState<'collection' | 'user' | 'nft'>('collection');

  const fetchWatchlist = async () => {
    if (!ready || !authenticated || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/watchlist?privyId=${user.id}&type=all`);
      const data: WatchlistData = await response.json();
      setWatchlistData(data);
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!user?.id || !newItemAddress.trim()) return;

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyId: user.id,
          type: newItemType,
          target: newItemType === 'nft' ? `${newItemAddress.split('-')[0]}-${newItemAddress.split('-')[1] || '1'}` : newItemAddress,
          notifications: {
            enableSales: true,
            enableListings: true,
            enablePriceChanges: true,
          }
        })
      });

      if (response.ok) {
        setNewItemAddress('');
        setShowAddForm(false);
        await fetchWatchlist();
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  const removeFromWatchlist = async (itemId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/watchlist?id=${itemId}&privyId=${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchWatchlist();
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [ready, authenticated, user?.id]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(1);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'collections': return Image;
      case 'users': return Users;
      case 'nfts': return Wallet;
      default: return Image;
    }
  };

  const getTabCount = (tab: string) => {
    const data = watchlistData[tab as keyof WatchlistData];
    return data ? data.length : 0;
  };

  const currentItems = watchlistData[activeTab] || [];

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="flex gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authenticated) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Watchlist</h2>
        </div>
        <div className="p-8 text-center">
          <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Please log in to view your watchlist</p>
          <p className="text-sm text-gray-400">Connect your wallet or sign in to get started</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="flex gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h2 className="text-xl font-semibold text-gray-900">Watchlist</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {showAddForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as 'collection' | 'user' | 'nft')}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="collection">Collection</option>
                <option value="user">User</option>
                <option value="nft">NFT</option>
              </select>

              <div className="flex-1">
                <input
                  type="text"
                  value={newItemAddress}
                  onChange={(e) => setNewItemAddress(e.target.value)}
                  placeholder={
                    newItemType === 'nft' 
                      ? 'Contract Address-Token ID (e.g., 0x1234...5678-1234)'
                      : 'Address (0x1234...5678)'
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={addToWatchlist}
                disabled={!newItemAddress.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                Add
              </button>

              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {(['collections', 'users', 'nfts'] as const).map((tab) => {
            const Icon = getTabIcon(tab);
            const count = getTabCount(tab);
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="capitalize">{tab}</span>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {currentItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-3">
              {activeTab === 'collections' && <Image className="h-12 w-12 mx-auto" />}
              {activeTab === 'users' && <Users className="h-12 w-12 mx-auto" />}
              {activeTab === 'nfts' && <Wallet className="h-12 w-12 mx-auto" />}
            </div>
            <p className="text-gray-500 mb-4">No {activeTab} in your watchlist</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Add your first {activeTab.slice(0, -1)}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {item.metadata?.image ? (
                      <img
                        src={item.metadata.image}
                        alt={item.metadata.name || 'Item'}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        {activeTab === 'collections' && <Image className="h-6 w-6 text-gray-400" />}
                        {activeTab === 'users' && <Users className="h-6 w-6 text-gray-400" />}
                        {activeTab === 'nfts' && <Wallet className="h-6 w-6 text-gray-400" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.metadata?.name || item.metadata?.alias || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {formatAddress(item.target)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      title="Notification settings"
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromWatchlist(item.id)}
                      title="Remove from watchlist"
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {activeTab === 'collections' && item.metadata && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Floor Price:</span>
                        <span className="font-medium">{item.metadata.floorPrice || '0'} FLOW</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">24h Volume:</span>
                        <span className="font-medium">{formatVolume(item.metadata.volume24h || '0')} FLOW</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Owners:</span>
                        <span className="font-medium">{item.metadata.owners || 0}</span>
                      </div>
                    </>
                  )}

                  {activeTab === 'users' && item.metadata && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Volume:</span>
                        <span className="font-medium">{formatVolume(item.metadata.totalVolume || '0')} FLOW</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">NFTs Owned:</span>
                        <span className="font-medium">{item.metadata.nftsOwned || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Activity:</span>
                        <span className="font-medium">
                          {item.metadata.lastActivity ? formatTime(item.metadata.lastActivity) : 'Unknown'}
                        </span>
                      </div>
                    </>
                  )}

                  {activeTab === 'nfts' && item.metadata && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Token ID:</span>
                        <span className="font-medium">#{item.metadata.tokenId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Collection:</span>
                        <span className="font-medium truncate">{item.metadata.collection || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Sale:</span>
                        <span className="font-medium">{item.metadata.lastSalePrice || '0'} FLOW</span>
                      </div>
                    </>
                  )}

                  <div className="pt-2 mt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Added {formatTime(item.addedAt)}</span>
                      <div className="flex gap-1">
                        {item.notifications?.enableSales && (
                          <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Sales</span>
                        )}
                        {item.notifications?.enableListings && (
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Listings</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 