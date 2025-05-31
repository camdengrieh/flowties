'use client';

import { Home, TrendingUp, Sword, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Main dashboard' },
  { name: 'Battles', href: '/battles', icon: Sword, description: 'PvP Trading Card Battles' },
  { name: 'Collections', href: '/collections', icon: TrendingUp, description: 'Collect and manage your cards' },
  { name: 'Settings', href: '/settings', icon: Settings, description: 'Manage your account settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-16 bg-gradient-to-b from-black via-red-950 to-blue-950 border-r border-red-900/30 z-20">
      <nav className="flex flex-col items-center py-4 space-y-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-orange-300 hover:bg-red-950/50'
              }`}
              title={item.description}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 