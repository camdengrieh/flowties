'use client';

import { Bell, Search } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

export default function Header() {
  const { user } = usePrivy();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Search */}
        <div className="flex flex-1 items-center">
          <div className="relative max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              placeholder="Search..."
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-x-4">
          {/* Notifications */}
          <button
            type="button"
            className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.email?.address ? 
                  user.email.address.split('@')[0] : 
                  user?.wallet?.address ? 
                    `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 
                    'User'
                }
              </p>
              <p className="text-xs text-gray-500">
                {user?.email?.address ? 'Email User' : 'Wallet User'}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.email?.address ? 
                  user.email.address.charAt(0).toUpperCase() : 
                  user?.wallet?.address ? 
                    user.wallet.address.charAt(2).toUpperCase() : 
                    'U'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 