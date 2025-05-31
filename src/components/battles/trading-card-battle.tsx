'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useReadContract, useWriteContract, useWatchPendingTransactions } from 'wagmi';
import { packBattlesABI } from '@/lib/abis/PackBattles';
import DynamicBattleStage from './dynamic-battle-stage';

const PACK_BATTLES_ADDRESS = process.env.NEXT_PUBLIC_PACK_BATTLES_ADDRESS || '';

interface Card {
  id: string;
  name: string;
  image: string;
  attack: number;
  defense: number;
}

interface BattlePayload {
  playerCard: Card;
  opponentCard: Card;
}

interface Game {
  creator: string;
  player: string;
  isActive: boolean;
  isCompleted: boolean;
  availableNFTs: bigint[];
  creatorNFTIndex: bigint;
  playerNFTIndex: bigint;
}

export default function TradingCardBattle() {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<BattlePayload | null>(null);
  const [gameId, setGameId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Contract reads
  const { data: gameFee } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'GAME_FEE',
  });

  const { data: gameCounter } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'gameCounter',
  });

  const { data: currentGame } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'getGame',
    args: gameId ? [gameId] : undefined,
  });

  // Contract writes
  const { writeContract } = useWriteContract();

  // Watch pending transactions
  useWatchPendingTransactions({
    onTransactions: () => {
      setLoading(false);
    },
  });

  // Watch for game updates
  useEffect(() => {
    if (currentGame && gameId) {
      const game = currentGame as Game;
      if (game.isCompleted) {
        handleGameComplete(game);
      }
    }
  }, [currentGame, gameId]);

  const handleCreateGame = async () => {
    if (!gameFee) {
      setError('Could not determine game fee');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await writeContract({
        address: PACK_BATTLES_ADDRESS as `0x${string}`,
        abi: packBattlesABI,
        functionName: 'createGame',
        value: gameFee,
      });

      // Set the game ID to the new counter value
      if (gameCounter) {
        setGameId(gameCounter);
      }
    } catch (err) {
      console.error('Failed to create game:', err);
      setError('Failed to create game. Please try again.');
      setLoading(false);
    }
  };

  const handleGameComplete = async (game: Game) => {
    try {
      // Get the NFTs involved in the battle
      const creatorNFT = game.availableNFTs[Number(game.creatorNFTIndex)];
      const playerNFT = game.availableNFTs[Number(game.playerNFTIndex)];

      // Fetch metadata for both NFTs
      const res = await fetch('/api/entropy/battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorNFT: Number(creatorNFT),
          playerNFT: Number(playerNFT),
        }),
      });

      const data = await res.json();
      setPayload(data);
      setGameId(null);
    } catch (error) {
      console.error('Failed to process game completion:', error);
      setError('Failed to process game completion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!gameCounter) {
      setError('Could not determine game counter');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Create a new game by default
      await handleCreateGame();
    } catch (error) {
      console.error('Failed to start battle:', error);
      setError('Failed to start battle. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/30 to-blue-950/30 p-8 flex flex-col items-center justify-start">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent mb-8 flex items-center gap-2">
        <Sparkles className="text-orange-400" />
        Trading Card Battle Arena
        <Sparkles className="text-orange-400" />
      </h1>

      {error && (
        <div className="mb-8 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {!payload && !gameId && (
        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-700 hover:via-orange-700 hover:to-red-700 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Waiting for opponent...
            </>
          ) : (
            <>
              <Sparkles />
              Start Pack Battle!
              <Sparkles />
            </>
          )}
        </button>
      )}

      {gameId && !payload && (
        <div className="text-orange-400 animate-pulse flex items-center gap-2">
          <Loader2 className="animate-spin" />
          Waiting for battle to complete...
        </div>
      )}

      {payload && <DynamicBattleStage initialData={payload} onReset={() => setPayload(null)} />}
    </div>
  );
} 