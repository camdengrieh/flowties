'use client';

import { Home, TrendingUp, Sword, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { packBattlesABI } from '../../lib/abis/PackBattles';

const PACK_BATTLES_ADDRESS = process.env.NEXT_PUBLIC_PACK_BATTLES_ADDRESS || '0x52b68B2576d3D4bc1eDC63cF36dB1B1BDCCc4F80';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Main dashboard' },
  { name: 'Battles', href: '/battles', icon: Sword, description: 'PvP Trading Card Battles' },
  { name: 'Collections', href: '/collections', icon: TrendingUp, description: 'Collect and manage your cards' },
  { name: 'Settings', href: '/settings', icon: Settings, description: 'Manage your account settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { address } = useAccount();
  const [isOwner, setIsOwner] = useState(false);

  const { data: owner } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'owner',
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (owner && address) {
      setIsOwner(owner.toLowerCase() === address.toLowerCase());
    }
  }, [owner, address]);

  if (!isClient) return null;

  // Combine navigation items with admin link if user is owner
  const navItems = isOwner ? [
    ...navigation,
    { name: 'Admin', href: '/admin', icon: Shield, description: 'Contract Administration' },
  ] : navigation;

  return (
    <div 
      className={`fixed items-center left-0 top-14 h-[calc(100vh-3.5rem)] bg-gradient-to-b from-black via-red-950 to-blue-950 border-r border-red-900/30 z-20 transition-all duration-300 ease-out ${
        isHovered ? 'w-56' : 'w-16'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav className="flex justify-center flex-col py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`h-10 flex items-center rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-orange-300 hover:bg-red-950/50'
              } ${
                isHovered 
                  ? 'mx-3 px-3' 
                  : 'mx-3 justify-center'
              }`}
              title={!isHovered ? item.description : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={`ml-3 font-medium transition-all duration-300 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 w-0 -translate-x-2'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 