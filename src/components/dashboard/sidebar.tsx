'use client';

import { Home, BarChart3, Swords } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Battles', href: '/battles', icon: Swords, description: 'PvP Trading Card Battles' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div 
      className="fixed left-0 top-14 bottom-0 z-20 flex flex-col bg-gray-900 shadow-xl transition-all duration-300 ease-in-out"
      style={{ 
        width: isHovered ? '240px' : '64px',
        borderRight: '1px solid rgb(31, 32, 35)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-x-3 rounded-md p-3 text-sm font-medium transition-colors overflow-hidden whitespace-nowrap ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={item.description}
                >
                  <item.icon
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className={`transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}>
                    {item.name}
                  </span>
                  {item.description && isHovered && (
                    <span className="ml-auto text-xs text-gray-500 truncate">
                      {item.description}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
} 