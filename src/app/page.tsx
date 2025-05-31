'use client';

import DashboardLayout from '../components/dashboard/dashboard-layout';
import StatsCard from '../components/dashboard/stats-card';
import Notifications from '../components/dashboard/notifications';
import Watchlist from '../components/dashboard/watchlist';
import ActivityFeed from '../components/dashboard/activity-feed';
import { Bell, Eye, Activity, TrendingUp } from 'lucide-react';
import { useCollectionStats } from '../lib/hooks/useCollectionStats';

export default function HomePage() {
  const { dashboardStats, loading } = useCollectionStats();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Monitor OpenSea NFT activity and manage your notifications.</p>
        </div>

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

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Notifications - Takes up 1 column */}
          <div className="xl:col-span-1">
            <Notifications />
          </div>

          {/* Activity Feed - Takes up 2 columns */}
          <div className="xl:col-span-2">
            <ActivityFeed />
          </div>
        </div>

        {/* Watchlist - Full width */}
        <div>
          <Watchlist />
        </div>
      </div>
    </DashboardLayout>
  );
}
