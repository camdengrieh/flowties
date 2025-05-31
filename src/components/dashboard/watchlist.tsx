/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="p-6 bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="flex gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-800 rounded w-24"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authenticated) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30">
        <div className="px-6 py-4 border-b border-red-900/30">
          <h2 className="text-xl font-semibold text-white">Watchlist</h2>
        </div>
        <div className="p-8 text-center">
          <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-300 mb-2">Please log in to view your watchlist</p>
          <p className="text-sm text-gray-500">Connect your wallet or sign in to get started</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="flex gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-800 rounded w-24"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30">
      <div className="px-6 py-4 border-b border-red-900/30">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Watchlist</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-700 hover:via-orange-700 hover:to-red-700 text-white rounded-lg transition-all duration-300 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {showAddForm && (
          <div className="mt-4 p-4 bg-gradient-to-br from-gray-800 to-red-900/20 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-4">
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as 'collection' | 'user' | 'nft')}
                className="border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
                />
              </div>

              <button
                onClick={addToWatchlist}
                disabled={!newItemAddress.trim()}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-all duration-300"
              >
                Add
              </button>

              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white rounded transition-all duration-300"
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500/50'
                    : 'text-gray-300 hover:bg-red-950/30 hover:text-orange-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="capitalize">{tab}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
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
            <div className="text-gray-500 mb-3">
              {activeTab === 'collections' && <Image className="h-12 w-12 mx-auto" />}
              {activeTab === 'users' && <Users className="h-12 w-12 mx-auto" />}
              {activeTab === 'nfts' && <Wallet className="h-12 w-12 mx-auto" />}
            </div>
            <p className="text-gray-400 mb-4">No {activeTab} in your watchlist</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              Add your first {activeTab.slice(0, -1)}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((item) => (
              <div key={item.id} className="border border-gray-700/50 bg-gradient-to-br from-gray-800 to-red-900/20 rounded-lg p-4 hover:border-orange-500/50 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {item.metadata?.image ? (
                      <img
                        src={item.metadata.image}
                        alt={item.metadata.name || 'Item'}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-600/50"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600/50">
                        {activeTab === 'collections' && <Image className="h-6 w-6 text-gray-400" />}
                        {activeTab === 'users' && <Users className="h-6 w-6 text-gray-400" />}
                        {activeTab === 'nfts' && <Wallet className="h-6 w-6 text-gray-400" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {item.metadata?.name || item.metadata?.alias || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        {formatAddress(item.target)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      title="Notification settings"
                      className="p-1 text-gray-400 hover:text-orange-400 transition-colors"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromWatchlist(item.id)}
                      title="Remove from watchlist"
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {activeTab === 'collections' && item.metadata && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Floor Price:</span>
                        <span className="font-medium text-orange-300">{item.metadata.floorPrice || '0'} FLOW</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">24h Volume:</span>
                        <span className="font-medium text-orange-300">{formatVolume(item.metadata.volume24h || '0')} FLOW</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Owners:</span>
                        <span className="font-medium text-white">{item.metadata.owners || 0}</span>
                      </div>
                    </>
                  )}

                  {activeTab === 'users' && item.metadata && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Volume:</span>
                        <span className="font-medium text-orange-300">{formatVolume(item.metadata.totalVolume || '0')} FLOW</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">NFTs Owned:</span>
                        <span className="font-medium text-white">{item.metadata.nftsOwned || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Last Activity:</span>
                        <span className="font-medium text-white">
                          {item.metadata.lastActivity ? formatTime(item.metadata.lastActivity) : 'Unknown'}
                        </span>
                      </div>
                    </>
                  )}

                  {activeTab === 'nfts' && item.metadata && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Token ID:</span>
                        <span className="font-medium text-white">#{item.metadata.tokenId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Collection:</span>
                        <span className="font-medium text-white truncate">{item.metadata.collection || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Last Sale:</span>
                        <span className="font-medium text-orange-300">{item.metadata.lastSalePrice || '0'} FLOW</span>
                      </div>
                    </>
                  )}

                  <div className="pt-2 mt-3 border-t border-gray-700/50">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Added {formatTime(item.addedAt)}</span>
                      <div className="flex gap-1">
                        {item.notifications?.enableSales && (
                          <span className="bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded border border-green-700/50">Sales</span>
                        )}
                        {item.notifications?.enableListings && (
                          <span className="bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded border border-blue-700/50">Listings</span>
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