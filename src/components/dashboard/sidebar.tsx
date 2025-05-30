'use client';

import { Home, Users, Settings, BarChart3, Wallet, LogOut } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { logout, user } = usePrivy();
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white">Flowties</h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'group flex gap-x-3 rounded-md p-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User info and logout */}
        <div className="mt-auto">
          <div className="px-3 py-4 border-t border-gray-700">
            {user && (
              <div className="mb-3">
                <p className="text-sm text-gray-300">Signed in as:</p>
                <p className="text-sm font-medium text-white truncate">
                  {user.email?.address || user.wallet?.address || 'Anonymous'}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className="group flex w-full gap-x-3 rounded-md p-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
} 