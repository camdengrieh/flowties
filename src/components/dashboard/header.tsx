'use client';

import { Bell } from 'lucide-react';
import { User } from '@privy-io/react-auth';

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

export default function Header({ user, onLogout, userInfo }: HeaderProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getUserDisplayName = () => {
    if (userInfo.email) {
      return userInfo.email;
    }
    if (userInfo.wallet) {
      return formatAddress(userInfo.wallet);
    }
    return formatAddress(userInfo.id);
  };

  const getUserAvatar = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FlowTies</h1>
          <p className="text-sm text-gray-600">NFT Activity Monitor</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-gray-500">
                {user.linkedAccounts?.length || 1} account{(user.linkedAccounts?.length || 1) !== 1 ? 's' : ''} linked
              </p>
            </div>
            
            <div className="relative">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {getUserAvatar()}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 