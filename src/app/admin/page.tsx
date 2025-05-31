'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { packBattlesABI } from '@/lib/abis/PackBattles';
import AdminPanel from '@/components/dashboard/admin-panel';

const PACK_BATTLES_ADDRESS = process.env.NEXT_PUBLIC_PACK_BATTLES_ADDRESS || '0xD3Fdb6f8CCf2F789bCe0AD679397EC7d52656Ff8';

export default function AdminPage() {
  const { address } = useAccount();
  const [isOwner, setIsOwner] = useState(false);

  const { data: owner } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'owner',
  });

  useEffect(() => {
    if (owner && address) {
      setIsOwner(owner.toLowerCase() === address.toLowerCase());
    }
  }, [owner, address]);

  if (!isOwner) {
    return (
        <div className="p-6 bg-black/50 rounded-xl border border-red-900/30">
          <div className="text-red-500">Access denied. You must be the contract owner to view this page.</div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">Contract Administration</h1>
          <p className="text-gray-400 mt-2">
            Manage your NFT contract settings and operations.
          </p>
        </div>

        <AdminPanel contractAddress={PACK_BATTLES_ADDRESS} />
      </div>
  );
} 