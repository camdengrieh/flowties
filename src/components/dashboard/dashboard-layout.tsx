'use client';

import { ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Header from './header';
import Sidebar from './sidebar';
import SalesMarquee from './sales-marquee';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { ready, authenticated, user, login } = usePrivy();

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black flex items-center justify-center">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 rounded-lg shadow-2xl border border-red-900/50 p-8">
          <div className="text-center">
            <button
              onClick={login}
              className="w-full bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-700 hover:via-orange-700 hover:to-red-700 text-white py-3 px-4 rounded-lg transition-all duration-300 font-medium shadow-lg"
            >
              Connect Wallet & Sign In
            </button>
            <p className="text-sm text-gray-400 mt-4">
              Sign in with your wallet, email, or Google account
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-screen bg-gradient-to-br from-black via-red-950/20 to-blue-950/20 overflow-x-hidden">
      {user && <Header />}
      <div className="flex overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 min-w-0" style={{ marginLeft: '64px' }}>
          <SalesMarquee />
          <main className="transition-all duration-300 ease-in-out">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 