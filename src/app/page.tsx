import DashboardLayout from '../components/dashboard/dashboard-layout';
import StatsCard from '../components/dashboard/stats-card';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value="2,345"
            change="+12% from last month"
            changeType="increase"
            icon={Users}
          />
          <StatsCard
            title="Revenue"
            value="$45,231"
            change="+8% from last month"
            changeType="increase"
            icon={DollarSign}
          />
          <StatsCard
            title="Active Sessions"
            value="892"
            change="-2% from last hour"
            changeType="decrease"
            icon={Activity}
          />
          <StatsCard
            title="Growth Rate"
            value="23.4%"
            change="+5.2% from last quarter"
            changeType="increase"
            icon={TrendingUp}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { action: 'New user registration', time: '2 minutes ago', user: 'john@example.com' },
                { action: 'Payment received', time: '5 minutes ago', user: 'sarah@example.com' },
                { action: 'Profile updated', time: '10 minutes ago', user: 'mike@example.com' },
                { action: 'New user registration', time: '15 minutes ago', user: 'anna@example.com' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Add New User</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Generate Report</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">View Analytics</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Export Data</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
