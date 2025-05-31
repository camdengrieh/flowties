'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Eye, DollarSign } from 'lucide-react';

interface CollectionStats {
  total: {
    volume: number;
    sales: number;
    average_price: number;
    num_owners: number;
    market_cap: number;
    floor_price: number;
  };
  intervals: Array<{
    interval: string;
    volume: number;
    volume_diff: number;
    sales: number;
    sales_diff: number;
    average_price: number;
  }>;
}

interface CollectionStatsCardProps {
  slug: string;
  collectionName?: string;
  className?: string;
}

export function CollectionStatsCard({ 
  slug, 
  collectionName = slug,
  className = "" 
}: CollectionStatsCardProps) {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/opensea/collections/${slug}/stats`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [slug]);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `${price.toFixed(2)} FLOW`;
    }
    return `${price.toFixed(4)} FLOW`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(0);
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Failed to load stats for {collectionName}</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const todayStats = stats.intervals.find(interval => interval.interval === '1d');
  const weekStats = stats.intervals.find(interval => interval.interval === '7d');

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{collectionName}</h3>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
            Stats
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* Floor Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <DollarSign className="h-4 w-4" />
            Floor Price
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total.floor_price ? formatPrice(stats.total.floor_price) : 'N/A'}
          </div>
        </div>

        {/* Total Volume */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <TrendingUp className="h-4 w-4" />
            Total Volume
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatVolume(stats.total.volume)} FLOW
          </div>
        </div>

        {/* Owners */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            Owners
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total.num_owners.toLocaleString()}
          </div>
        </div>

        {/* 24h Volume */}
        {todayStats && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Eye className="h-4 w-4" />
              24h Volume
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatVolume(todayStats.volume)} FLOW
              </span>
              {todayStats.volume_diff !== 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  todayStats.volume_diff > 0 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}>
                  {todayStats.volume_diff > 0 ? '+' : ''}
                  {todayStats.volume_diff.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        )}

        {/* 24h Sales */}
        {todayStats && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="h-4 w-4" />
              24h Sales
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {todayStats.sales}
              </span>
              {todayStats.sales_diff !== 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  todayStats.sales_diff > 0 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}>
                  {todayStats.sales_diff > 0 ? '+' : ''}
                  {todayStats.sales_diff.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        )}

        {/* Average Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <DollarSign className="h-4 w-4" />
            Avg Price
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(stats.total.average_price)}
          </div>
        </div>
      </div>

      {/* 7-day trend */}
      {weekStats && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">7-Day Trend</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Volume</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">{formatVolume(weekStats.volume)} FLOW</span>
                {weekStats.volume_diff !== 0 && (
                  <div className={`flex items-center gap-1 text-xs ${
                    weekStats.volume_diff > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {weekStats.volume_diff > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(weekStats.volume_diff).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sales</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">{weekStats.sales}</span>
                {weekStats.sales_diff !== 0 && (
                  <div className={`flex items-center gap-1 text-xs ${
                    weekStats.sales_diff > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {weekStats.sales_diff > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(weekStats.sales_diff).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 