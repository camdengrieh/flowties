'use client';

import { Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { formatEther } from 'viem';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
}

// WFLOW contract address on Flow mainnet
const WFLOW_ADDRESS = '0xd3bF53DAC106A0290B0483EcBC89d40FcD961c27';

export default function Header() {
  const { logout, ready, authenticated, user } = usePrivy();
  const { address, isConnected } = useAccount();

  // Get native FLOW balance
  const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({
    address: address,
  });

  // Get WFLOW ERC20 balance
  const { data: wflowBalance, isLoading: isLoadingWflow } = useReadContract({
    address: WFLOW_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0.00';
    const formatted = formatEther(balance);
    return parseFloat(formatted).toFixed(4);
  };

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState<Notification[]>([]);
  const [unreadCount] = useState(0);
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
    if (user?.wallet?.address) {
      return formatAddress(user.wallet.address);
    }
    if (user?.email?.address) {
      return user.email.address;
    }
    return formatAddress(user?.id || '');
  };

  const getUserInitial = () => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-gradient-to-r from-black via-red-950 to-blue-950 border-b border-red-900/30 sticky top-0 z-30">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent">FlipOrFlow</h1>
        </div>

        {/* Right side elements */}
        <div className="flex items-center gap-6">
          {/* Native FLOW Balance */}
          {isConnected && (
            <div className="flex items-center gap-2 text-orange-200">
              {/* <svg className="h-5 w-5" viewBox="0 0 784.37 1277.39" xmlns="http://www.w3.org/2000/svg">
                <g fill="currentColor">
                  <path d="M392.07 0l-8.57 29.11v844.63l8.57 8.55 392.06-231.75z"/>
                  <path d="M392.07 0L0 650.54l392.07 231.75V472.33z"/>
                  <path d="M392.07 956.52l-4.83 5.89v300.87l4.83 14.1 392.3-552.49z"/>
                  <path d="M392.07 1277.38V956.52L0 724.89z"/>
                </g>
              </svg> */}
              <span className="font-mono">
                {isLoadingNative ? '...' : `${formatBalance(nativeBalance?.value)} FLOW`}
              </span>
            </div>
          )}

          {/* WFLOW Balance */}
          {isConnected && (
            <div className="flex items-center gap-2 text-blue-200">
              <span className="font-mono">
                {isLoadingWflow ? '...' : `${formatBalance(wflowBalance)} WFLOW`}
              </span>
            </div>
          )}

          {ready && authenticated && user && (
            <>
              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-orange-200 hover:text-orange-100 hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 border border-red-900/50 shadow-2xl">
                    <div className="p-4 border-b border-red-900/30">
                      <h3 className="text-lg font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className="p-3 border-b border-red-900/20 last:border-b-0 hover:bg-red-950/30 transition-colors"
                          >
                            <p className="text-white text-sm font-medium">{notification.title}</p>
                            <p className="text-gray-300 text-xs mt-1">{notification.message}</p>
                            <p className="text-gray-500 text-xs mt-1">{notification.timestamp}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 text-orange-200 hover:text-orange-100 hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white font-bold">
                    {getUserInitial()}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 rounded-lg bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 border border-red-900/50 shadow-2xl">
                    <div className="p-3">
                      <div className="flex items-center gap-3 p-2 rounded-lg">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white">
                          {getUserInitial()}
                        </div>
                        <div>
                          <div className="text-white font-medium">{getUserDisplayName()}</div>
                          <div className="text-orange-300 text-sm">
                            {isConnected && nativeBalance ? `${formatBalance(nativeBalance.value)} FLOW` : '0.00 FLOW'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-red-900/30">
                      <Link 
                        href="/settings" 
                        className="w-full flex items-center gap-3 p-3 text-white hover:bg-red-950/50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserIcon className="h-5 w-5" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-red-900/30">
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-950/50 transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 