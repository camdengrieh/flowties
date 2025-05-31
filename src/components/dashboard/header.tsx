'use client';

import { Bell, ChevronDown, LogOut, Plus, User as UserIcon } from 'lucide-react';
import { User } from '@privy-io/react-auth';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface UserInfo {
  id: string;
  email?: string;
  wallet?: string;
  createdAt: string;
}

interface HeaderProps {
  user: User;
  onLogout: () => void;
  userInfo: UserInfo;
}

export default function Header({ onLogout, userInfo }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getUserDisplayName = () => {
    if (userInfo.wallet) {
      return formatAddress(userInfo.wallet);
    }
    if (userInfo.email) {
      return userInfo.email;
    }
    return formatAddress(userInfo.id);
  };

  return (
    <header className="bg-[#1a1b1e] border-b border-gray-800">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white">flowtis</h1>
        </div>

        {/* Right side elements */}
        <div className="flex items-center gap-6">
          {/* ETH Balance */}
          <div className="flex items-center gap-2 text-white">
            <svg className="h-5 w-5" viewBox="0 0 784.37 1277.39" xmlns="http://www.w3.org/2000/svg">
              <g fill="#FFF">
                <path d="M392.07 0l-8.57 29.11v844.63l8.57 8.55 392.06-231.75z"/>
                <path d="M392.07 0L0 650.54l392.07 231.75V472.33z"/>
                <path d="M392.07 956.52l-4.83 5.89v300.87l4.83 14.1 392.3-552.49z"/>
                <path d="M392.07 1277.38V956.52L0 724.89z"/>
              </g>
            </svg>
            <span className="font-mono">0.4542 FLOW</span>
          </div>

          {/* WETH Balance */}
          <div className="flex items-center gap-2 text-white">
            <span className="font-mono">0.00 WFLOW</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button 
              className="relative p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg bg-[#1a1b1e] border border-gray-800 shadow-lg">
                <div className="p-4">
                  <h3 className="text-white font-medium mb-2">Notifications</h3>
                  <div className="text-gray-400 text-sm">No new notifications</div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <div className="relative h-6 w-6 rounded-full overflow-hidden bg-gray-700">
                <div className="h-full w-full flex items-center justify-center text-white text-sm">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </div>
              </div>
              <span className="text-sm text-white font-medium">
                {getUserDisplayName()}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg bg-[#1a1b1e] border border-gray-800 shadow-lg">
                <div className="p-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-white">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{getUserDisplayName()}</div>
                      <div className="text-gray-400 text-sm">$1,304.42</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800">
                  <button className="w-full flex items-center gap-3 p-3 text-white hover:bg-gray-800 transition-colors">
                    <Plus className="h-5 w-5" />
                    <span>Connect Wallet</span>
                  </button>
                </div>

                <div className="border-t border-gray-800">
                  <Link 
                    href="/profile" 
                    className="w-full flex items-center gap-3 p-3 text-white hover:bg-gray-800 transition-colors"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                </div>

                <div className="border-t border-gray-800">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-gray-800 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 