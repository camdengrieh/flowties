'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useReadContract, useWriteContract, useWatchContractEvent, useAccount } from 'wagmi';
import { Sparkles, Loader2, Gift, Trophy } from 'lucide-react';
import { packOpeningABI } from '@/lib/abis/PackOpening';

const WINBOX_ADDRESS = '0x99aB51A61227d873529476f5A18F8fa997CfA8c0';

interface NFTCard {
  id: string;
  tokenId: number;
  name: string;
  rarity: string;
  color: string;
}

const WinBox = () => {
  const { address } = useAccount();
  const [isAnimating, setIsAnimating] = useState(false);
  const [winningCard, setWinningCard] = useState<NFTCard | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [winningTokenId, setWinningTokenId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Contract reads
  const { data: packCost } = useReadContract({
    address: WINBOX_ADDRESS as `0x${string}`,
    abi: packOpeningABI,
    functionName: 'PACK_COST',
  });

  const { data: availableNFTs } = useReadContract({
    address: WINBOX_ADDRESS as `0x${string}`,
    abi: packOpeningABI,
    functionName: 'getAvailableNFTs',
  });

  const { data: nftCount } = useReadContract({
    address: WINBOX_ADDRESS as `0x${string}`,
    abi: packOpeningABI,
    functionName: 'getAvailableNFTCount',
  });

  // Contract write
  const { writeContractAsync, isPending: isOpeningPack } = useWriteContract();

  // Convert NFT tokenIds to card format
  const tradingCards: NFTCard[] = useMemo(() => {
    if (!availableNFTs) return [];
    
    return (availableNFTs as bigint[]).map((tokenId) => {
      const id = Number(tokenId);
      const colors = [
        'bg-gradient-to-br from-gray-400 to-blue-300',
        'bg-gradient-to-br from-blue-500 to-cyan-500',
        'bg-gradient-to-br from-purple-500 to-pink-500',
        'bg-gradient-to-br from-yellow-400 to-orange-600'
      ];
      
      // Determine rarity based on tokenId (you can customize this logic)
      let rarity: string;
      let color: string;
      
      if (id <= 10) {
        rarity = 'Legendary';
        color = colors[3];
      } else if (id <= 50) {
        rarity = 'Epic';
        color = colors[2];
      } else if (id <= 150) {
        rarity = 'Rare';
        color = colors[1];
      } else {
        rarity = 'Common';
        color = colors[0];
      }

      return {
        id: `nft-${id}`,
        tokenId: id,
        name: `NFT #${id}`,
        rarity,
        color
      };
    });
  }, [availableNFTs]);

  // Watch for PackOpened events
  useWatchContractEvent({
    address: WINBOX_ADDRESS as `0x${string}`,
    abi: packOpeningABI,
    eventName: 'PackOpened',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { args } = log;
        if (args && args.player === address && args.tokenId) {
          setWinningTokenId(Number(args.tokenId));
        }
      });
    },
  });

  const getRarityGlow = (rarity: string) => {
    switch(rarity) {
      case 'Legendary': return 'shadow-2xl shadow-yellow-500/50';
      case 'Epic': return 'shadow-xl shadow-purple-500/40';
      case 'Rare': return 'shadow-lg shadow-blue-500/30';
      default: return 'shadow-md shadow-gray-500/20';
    }
  };

  const startWinBox = async () => {
    if (!packCost || !address) return;

    try {
      setIsAnimating(true);
      setShowResult(false);
      setWinningCard(null);
      setWinningTokenId(null);

      // Reset scroll position
      if (scrollRef.current) {
        scrollRef.current.style.transform = 'translateX(0)';
        scrollRef.current.style.transition = 'none';
      }

      // Call the contract to open a pack
      await writeContractAsync({
        address: WINBOX_ADDRESS as `0x${string}`,
        abi: packOpeningABI,
        functionName: 'openPack',
        value: packCost,
      }, {
        onSuccess: () => {
        },
        onError: () => {
          setIsAnimating(false);
        },
      });

    } catch (error) {
      console.error('Failed to open pack:', error);
      setIsAnimating(false);
    }
  };

  // Start animation when we receive the winning tokenId
  useEffect(() => {
    if (winningTokenId && tradingCards.length > 0 && isAnimating) {
      const winningCard = tradingCards.find(card => card.tokenId === winningTokenId);
      
      if (winningCard) {
        // Start the animation after a brief delay
        setTimeout(() => {
          if (scrollRef.current) {
            // Calculate the position to stop at the winning card
            const cardWidth = 200; // Width of each card including margin
            const containerWidth = 800; // Width of the visible container
            const centerOffset = containerWidth / 2 - cardWidth / 2;
            const winningIndex = tradingCards.findIndex(card => card.tokenId === winningTokenId);
            const scrollDistance = -(winningIndex * cardWidth - centerOffset);
            
            scrollRef.current.style.transform = `translateX(${scrollDistance}px)`;
            scrollRef.current.style.transition = 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          }
        }, 500);
        
        // Show result after animation completes
        setTimeout(() => {
          setWinningCard(winningCard);
          setShowResult(true);
          setIsAnimating(false);
        }, 3700);
      }
    }
  }, [winningTokenId, tradingCards, isAnimating]);

  const reset = () => {
    setIsAnimating(false);
    setWinningCard(null);
    setShowResult(false);
    setWinningTokenId(null);
    if (scrollRef.current) {
      scrollRef.current.style.transform = 'translateX(0)';
      scrollRef.current.style.transition = 'none';
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/30 to-blue-950/30 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Connect your wallet to start opening WinBoxes!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/30 to-blue-950/30 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Gift className="text-yellow-400" />
          WinBox
          <Gift className="text-yellow-400" />
        </h1>
        <p className="text-gray-300 text-lg mb-2">
          Open a pack and discover your NFT prize!
        </p>
        <div className="text-sm text-gray-400">
          <p>Available NFTs: {nftCount ? Number(nftCount) : 0}</p>
          <p>Entry Cost: {packCost ? '1 FLOW' : 'Loading...'}</p>
        </div>
      </div>

      {/* Animation Container */}
      <div className="relative w-full max-w-4xl h-80 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl overflow-hidden border border-slate-600 backdrop-blur-sm">
        {/* Center indicator line */}
        <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-yellow-400 to-red-500 transform -translate-x-1/2 z-10 opacity-80"></div>
        
        {/* Cards container */}
        {tradingCards.length > 0 && (
          <div 
            ref={scrollRef}
            className="flex items-center h-full py-8 pl-8"
            style={{ 
              width: `${tradingCards.length * 200 + 1600}px`,
              transform: 'translateX(0)',
              transition: 'none'
            }}
          >
            {/* Extra padding cards for smooth animation */}
            {Array.from({ length: 8 }, (_, i) => {
              const card = tradingCards[i % tradingCards.length];
              return (
                <div key={`pad-left-${i}`} className="w-48 h-64 mx-2 opacity-50">
                  <div className={`w-full h-full rounded-lg ${card?.color || 'bg-gray-500'} flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm text-center px-2">
                      {card?.name || 'NFT'}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Main cards */}
            {tradingCards.map((card) => (
              <div 
                key={card.id} 
                className={`w-48 h-64 mx-2 rounded-lg ${card.color} ${getRarityGlow(card.rarity)} flex flex-col items-center justify-center text-white transform hover:scale-105 transition-transform duration-200`}
              >
                <div className="text-center p-4">
                  <h3 className="font-bold text-lg mb-2">{card.name}</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    card.rarity === 'Legendary' ? 'bg-yellow-500' :
                    card.rarity === 'Epic' ? 'bg-purple-500' :
                    card.rarity === 'Rare' ? 'bg-blue-500' : 'bg-gray-500'
                  }`}>
                    {card.rarity}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Extra padding cards */}
            {Array.from({ length: 8 }, (_, i) => {
              const card = tradingCards[i % tradingCards.length];
              return (
                <div key={`pad-right-${i}`} className="w-48 h-64 mx-2 opacity-50">
                  <div className={`w-full h-full rounded-lg ${card?.color || 'bg-gray-500'} flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm text-center px-2">
                      {card?.name || 'NFT'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading state */}
        {tradingCards.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-400">Loading NFTs...</p>
            </div>
          </div>
        )}

        {/* Overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-slate-900/60 pointer-events-none"></div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={startWinBox}
          disabled={isAnimating || isOpeningPack || !tradingCards.length}
          className={`px-8 py-3 rounded-lg font-bold text-white transition-all duration-200 flex items-center gap-2 ${
            isAnimating || isOpeningPack || !tradingCards.length
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 shadow-lg'
          }`}
        >
          {isOpeningPack ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opening Pack...
            </>
          ) : isAnimating ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              Spinning...
            </>
          ) : (
            <>
              🎰 Open WinBox (1 FLOW)
            </>
          )}
        </button>
        
        <button
          onClick={reset}
          disabled={isAnimating || isOpeningPack}
          className="px-8 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transform hover:scale-105 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Reset
        </button>
      </div>

      {/* Result Display */}
      {showResult && winningCard && (
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/50 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6" />
              Congratulations!
              <Trophy className="w-6 h-6" />
            </h2>
            <div className="text-white">
              <p className="text-lg mb-2">You won:</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                {winningCard.name}
              </p>
              <p className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mt-2 ${
                winningCard.rarity === 'Legendary' ? 'bg-yellow-500' :
                winningCard.rarity === 'Epic' ? 'bg-purple-500' :
                winningCard.rarity === 'Rare' ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
                {winningCard.rarity}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinBox; 