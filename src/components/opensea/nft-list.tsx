'use client';

import { useOpenSeaNFTs } from '@/lib/hooks/useOpenSeaNFTs';
import { Loader2 } from 'lucide-react';

interface NFTListProps {
  address: string;
  collection: string;
}

export default function NFTList({ address, collection }: NFTListProps) {
  const { nfts, isLoading, error } = useOpenSeaNFTs(address, collection);

  if (error) {
    return (
      <div className="p-4 bg-red-950/30 border border-red-500 rounded-lg text-red-400">
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!nfts.length) {
    return (
      <div className="p-4 text-gray-400 text-center">
        No NFTs found in this collection
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {nfts.map((nft) => (
        <div
          key={nft.identifier}
          className="bg-gradient-to-br from-black via-red-950/30 to-blue-950/30 border border-red-900/30 rounded-lg overflow-hidden hover:border-orange-500/50 transition-all duration-300"
        >
          <div className="aspect-square relative">
            <img
              src={nft.image_url}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-2">{nft.name}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">{nft.description}</p>
            <div className="mt-2 text-xs text-orange-400">
              Token ID: {nft.identifier}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 