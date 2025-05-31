'use client';

import StatsCard from '../components/dashboard/stats-card';
import Watchlist from '../components/dashboard/watchlist';
import MarketActivity from '../components/dashboard/market-activity';
import { Bell, Eye, Activity, TrendingUp } from 'lucide-react';
import { useCollectionStats } from '../lib/hooks/useCollectionStats';
import { useTopOfferNotifications } from '@/lib/hooks/useTopOfferNotifications';

export default function HomePage() {
  const { dashboardStats, loading } = useCollectionStats();
  useTopOfferNotifications();

  return (
      <div className="space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Alerts"
            value={loading ? "..." : dashboardStats.activeAlerts.toString()}
            change="+3 new this week"
            changeType="increase"
            icon={Bell}
          />
          <StatsCard
            title="Watchlist Items"
            value={loading ? "..." : dashboardStats.watchlistItems.toString()}
            change="Including BeezieCollectibles"
            changeType="neutral"
            icon={Eye}
          />
          <StatsCard
            title="24h Events"
            value={loading ? "..." : dashboardStats.events24h.toString()}
            change="+23% from yesterday"
            changeType="increase"
            icon={Activity}
          />
          <StatsCard
            title="Volume Tracked"
            value={loading ? "..." : dashboardStats.volumeTracked}
            change="+15.2% this week"
            changeType="increase"
            icon={TrendingUp}
          />
        </div>

        {/* Market Activity */}
        <MarketActivity />

        {/* Watchlist */}
        <Watchlist />
      </div>
  );
}
