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
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <button
              onClick={login}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Connect Wallet & Sign In
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Sign in with your wallet, email, or Google account
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-screen bg-gray-50">
      {user && (
        <Header 
          user={user} 
          onLogout={logout}
          userInfo={{
            id: user.id,
            email: user.email?.address,
            wallet: user.wallet?.address,
            createdAt: user.createdAt.toISOString()
          }}
        />
      )}
      <SalesMarquee />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: '64px' }}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 