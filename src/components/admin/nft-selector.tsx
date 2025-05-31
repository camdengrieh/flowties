'use client';

import { useState } from 'react';
import { useOpenSeaNFTs } from '@/lib/hooks/useOpenSeaNFTs';
import { useAccount, useWriteContract } from 'wagmi';
import { Loader2, Plus, Check } from 'lucide-react';
import { packBattlesABI } from '@/lib/abis/PackBattles';
import { erc721Abi } from 'viem';

const PACK_BATTLES_ADDRESS = process.env.NEXT_PUBLIC_PACK_BATTLES_ADDRESS || '0x52b68B2576d3D4bc1eDC63cF36dB1B1BDCCc4F80';

interface NFTSelectorProps {
  collection: string;
  onSuccess?: () => void;
}

export default function NFTSelector({ collection, onSuccess }: NFTSelectorProps) {
  const { address } = useAccount();
  const { nfts, isLoading, error } = useOpenSeaNFTs(address || '', collection);
  const [selectedNFTs, setSelectedNFTs] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvedNFTs, setApprovedNFTs] = useState<Set<string>>(new Set());

  const { writeContractAsync } = useWriteContract();

  const handleToggleNFT = (tokenId: string) => {
    const newSelected = new Set(selectedNFTs);
    if (newSelected.has(tokenId)) {
      newSelected.delete(tokenId);
    } else {
      newSelected.add(tokenId);
    }
    setSelectedNFTs(newSelected);
  };

  const handleApproveNFTs = async () => {
    if (!selectedNFTs.size || !nfts.length) return;

    setIsApproving(true);
    try {
      // Get the contract address from the first NFT
      const nft = nfts.find(n => selectedNFTs.has(n.identifier));
      if (!nft) throw new Error('No NFT found');

      // Approve all selected NFTs
      await writeContractAsync({
        address: nft.contract as `0x${string}`,
        abi: erc721Abi,
        functionName: 'setApprovalForAll',
        args: [PACK_BATTLES_ADDRESS as `0x${string}`, true],
      });

      // Mark all selected NFTs as approved
      setApprovedNFTs(new Set([...approvedNFTs, ...selectedNFTs]));
    } catch (err) {
      console.error('Failed to approve NFTs:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleAddToContract = async () => {
    if (!selectedNFTs.size) return;

    setIsAdding(true);
    try {
      await writeContractAsync({
        address: PACK_BATTLES_ADDRESS as `0x${string}`,
        abi: packBattlesABI,
        functionName: 'addNFTs',
        args: [Array.from(selectedNFTs).map(id => BigInt(id))],
      });

      setSelectedNFTs(new Set());
      onSuccess?.();
    } catch (err) {
      console.error('Failed to add NFTs:', err);
    } finally {
      setIsAdding(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-950/30 border border-red-500 rounded-lg text-red-400">
        Error loading NFTs: {error}
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

  const allSelectedApproved = Array.from(selectedNFTs).every(id => approvedNFTs.has(id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          Select NFTs to Add ({selectedNFTs.size} selected)
        </h3>
        <div className="flex items-center gap-2">
          {selectedNFTs.size > 0 && !allSelectedApproved && (
            <button
              onClick={handleApproveNFTs}
              disabled={isApproving || !selectedNFTs.size}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Approve NFTs
                </>
              )}
            </button>
          )}
          <button
            onClick={handleAddToContract}
            disabled={!selectedNFTs.size || isAdding || !allSelectedApproved}
            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Contract
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {nfts.map((nft) => {
          const isSelected = selectedNFTs.has(nft.identifier);
          const isApproved = approvedNFTs.has(nft.identifier);
          return (
            <div
              key={nft.identifier}
              onClick={() => handleToggleNFT(nft.identifier)}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                isSelected 
                  ? 'border-orange-500 shadow-lg shadow-orange-500/20' 
                  : 'border-gray-700 hover:border-orange-500/50'
              }`}
            >
              {/* Selection Overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                  <div className={`${
                    isApproved ? 'bg-green-500' : 'bg-orange-500'
                  } text-white px-2 py-1 rounded-full text-sm flex items-center gap-1`}>
                    {isApproved ? (
                      <>
                        <Check className="w-3 h-3" />
                        Approved
                      </>
                    ) : (
                      'Selected'
                    )}
                  </div>
                </div>
              )}
              
              <div className="aspect-square relative">
                <img
                  src={nft.image_url}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 bg-black/50 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-white truncate">
                  {nft.name}
                </h3>
                <p className="text-xs text-orange-400">
                  ID: {nft.identifier}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 