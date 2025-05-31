'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import DashboardLayout from '../../components/dashboard/dashboard-layout';
import { Bell, Phone, MessageCircle, Save, Plus, Trash2 } from 'lucide-react';

interface Subscription {
  id: string;
  userPrivyId: string;
  subscriptionType: string;
  target?: string;
  isActive: boolean;
  enableInApp: boolean;
  enableSms: boolean;
  enableTelegram: boolean;
  smsNumber?: string;
  telegramChatId?: string;
  createdAt: number;
}

export default function SettingsPage() {
  const { ready, authenticated, user } = usePrivy();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smsNumber, setSmsNumber] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [newSubscription, setNewSubscription] = useState({
    type: 'offers_received',
    target: ''
  });

  const fetchSubscriptions = async () => {
    if (!ready || !authenticated || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions?privyId=${user.id}`);
      const data = await response.json();
      setSubscriptions(data.subscriptions);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In a real app, you'd update the user's settings here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addSubscription = async () => {
    if (!user?.id || !newSubscription.type) return;

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyId: user.id,
          subscriptionType: newSubscription.type,
          target: newSubscription.target || null,
          enableInApp: true,
          enableSms: false,
          enableTelegram: false,
          smsNumber,
          telegramChatId
        })
      });

      if (response.ok) {
        setNewSubscription({ type: 'offers_received', target: '' });
        await fetchSubscriptions();
      }
    } catch (error) {
      console.error('Failed to add subscription:', error);
    }
  };

  const removeSubscription = async (subscriptionId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/subscriptions?id=${subscriptionId}&privyId=${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchSubscriptions();
      }
    } catch (error) {
      console.error('Failed to remove subscription:', error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, user?.id]);

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!authenticated) {
    return (
      <DashboardLayout>
        <div className="bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30">
          <div className="px-6 py-4 border-b border-red-900/30">
            <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
          </div>
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-300 mb-2">Please log in to access settings</p>
            <p className="text-sm text-gray-500">Connect your wallet or sign in to get started</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
          <p className="text-gray-400">Manage your notification preferences and channels.</p>
        </div>

        {/* Notification Channels */}
        <div className="bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30">
          <div className="px-6 py-4 border-b border-red-900/30">
            <h2 className="text-lg font-semibold text-white">Notification Channels</h2>
            <p className="text-sm text-gray-400">Configure how you want to receive notifications.</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* In-App Notifications */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">In-App Notifications</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Receive notifications directly in the dashboard.
                </p>
                <label className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-300">Enable in-app notifications</span>
                </label>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-green-600 to-green-500 rounded-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">SMS Notifications</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Get important alerts via text message.
                </p>
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">Enable SMS notifications</span>
                  </label>
                  <input
                    type="tel"
                    value={smsNumber}
                    onChange={(e) => setSmsNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="block w-full max-w-xs text-sm border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Telegram Notifications */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">Telegram Notifications</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Receive alerts via Telegram bot.
                </p>
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">Enable Telegram notifications</span>
                  </label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="Your Telegram Chat ID"
                    className="block w-full max-w-xs text-sm border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    Start a chat with our bot @FlowNotificationBot to get your Chat ID
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-lg shadow-2xl border border-red-900/30">
          <div className="px-6 py-4 border-b border-red-900/30">
            <h2 className="text-lg font-semibold text-white">Active Subscriptions</h2>
            <p className="text-sm text-gray-400">Manage what types of events trigger notifications.</p>
          </div>
          
          <div className="p-6">
            {/* Add New Subscription */}
            <div className="mb-6 p-4 bg-gradient-to-br from-gray-800 to-red-900/20 rounded-lg border border-gray-700/50">
              <h3 className="text-sm font-medium text-white mb-3">Add New Subscription</h3>
              <div className="flex items-center gap-4">
                <select
                  value={newSubscription.type}
                  onChange={(e) => setNewSubscription({ ...newSubscription, type: e.target.value })}
                  className="border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="offers_received">Offers Received</option>
                  <option value="sales_completed">Sales Completed</option>
                  <option value="user_activity">User Activity</option>
                  <option value="collection_surge">Collection Volume Surge</option>
                </select>

                <input
                  type="text"
                  value={newSubscription.target}
                  onChange={(e) => setNewSubscription({ ...newSubscription, target: e.target.value })}
                  placeholder="Target address (optional)"
                  className="flex-1 border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"
                />

                <button
                  onClick={addSubscription}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-700 hover:via-orange-700 hover:to-red-700 text-white rounded transition-all duration-300"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Existing Subscriptions */}
            <div className="space-y-3">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between p-4 border border-gray-700/50 bg-gradient-to-br from-gray-800 to-red-900/20 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white capitalize">
                      {subscription.subscriptionType.replace('_', ' ')}
                    </h4>
                    {subscription.target && (
                      <p className="text-sm text-gray-400">
                        Target: {subscription.target.slice(0, 8)}...{subscription.target.slice(-6)}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        subscription.isActive 
                          ? 'bg-green-900/50 text-green-400 border-green-700/50' 
                          : 'bg-gray-700/50 text-gray-400 border-gray-600/50'
                      }`}>
                        {subscription.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex gap-1">
                        {subscription.enableInApp && (
                          <span className="text-xs bg-orange-900/50 text-orange-400 border border-orange-700/50 px-1.5 py-0.5 rounded">App</span>
                        )}
                        {subscription.enableSms && (
                          <span className="text-xs bg-green-900/50 text-green-400 border border-green-700/50 px-1.5 py-0.5 rounded">SMS</span>
                        )}
                        {subscription.enableTelegram && (
                          <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-700/50 px-1.5 py-0.5 rounded">Telegram</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeSubscription(subscription.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove subscription"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {subscriptions.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No active subscriptions</p>
                  <p className="text-sm text-gray-500">Add your first subscription above</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-700 hover:via-orange-700 hover:to-red-700 disabled:opacity-50 text-white rounded-lg transition-all duration-300 shadow-lg"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
} 