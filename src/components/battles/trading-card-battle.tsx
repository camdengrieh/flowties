'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Trophy, Clock, Sword, Eye } from 'lucide-react';
import { useReadContract, useReadContracts, useWriteContract, useWatchPendingTransactions, useAccount } from 'wagmi';
import { packBattlesABI } from '@/lib/abis/PackBattles';
import DynamicBattleStage from './dynamic-battle-stage';

const PACK_BATTLES_ADDRESS = process.env.NEXT_PUBLIC_PACK_BATTLES_ADDRESS || '0xD3Fdb6f8CCf2F789bCe0AD679397EC7d52656Ff8';

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

interface GameWithId extends Game {
  id: number;
}

export default function TradingCardBattle() {
  const router = useRouter();
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<BattlePayload | null>(null);
  const [gameId, setGameId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joiningGameId, setJoiningGameId] = useState<number | null>(null);

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

  // Generate contracts array for reading all games
  const gameContracts = useMemo(() => {
    if (!gameCounter) return [];
    
    const contracts = [];
    for (let i = 0; i < Number(gameCounter); i++) {
      contracts.push({
        address: PACK_BATTLES_ADDRESS as `0x${string}`,
        abi: packBattlesABI,
        functionName: 'getGame',
        args: [BigInt(i)],
      });
    }
    return contracts;
  }, [gameCounter]);

  const { data: gamesData } = useReadContracts({
    contracts: gameContracts,
  });

  // Process games data
  const games: GameWithId[] = useMemo(() => {
    if (!gamesData) return [];
    
    return gamesData.map((result, index) => {
      if (result.status === 'success' && result.result) {
        const gameData = result.result as unknown as Game;
        return {
          id: index,
          ...gameData,
        };
      }
      return null;
    }).filter(Boolean) as GameWithId[];
  }, [gamesData]);

  const { data: currentGame } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'getGame',
    args: gameId ? [gameId] : undefined,
  });

  // Contract writes
  const { writeContractAsync, isPending: isCreatingGame } = useWriteContract();

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
      await writeContractAsync({
        address: PACK_BATTLES_ADDRESS as `0x${string}`,
        abi: packBattlesABI,
        functionName: 'createGame',
        value: gameFee,
      },
      {
        onSuccess: () => {
          if (gameCounter) {
            setGameId(gameCounter);
          }
        },
        onError: (error) => {
          console.error('Failed to create game:', error);
          setError('Failed to create game. Please try again.');
          setLoading(false);
        },
      }
    );

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

  const handleJoinGame = async (gameIdToJoin: number) => {
    if (!gameFee) return;

    setJoiningGameId(gameIdToJoin);
    try {
      await writeContractAsync({
        address: PACK_BATTLES_ADDRESS as `0x${string}`,
        abi: packBattlesABI,
        functionName: 'joinGame',
        args: [BigInt(gameIdToJoin)],
        value: gameFee,
      });

      // Refresh games after joining
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Failed to join game:', error);
    } finally {
      setJoiningGameId(null);
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
    try {
      // Create a new game by default
      await handleCreateGame();
    } catch (error) {
      console.error('Failed to start battle:', error);
      setError('Failed to start battle. Please try again.');
      setLoading(false);
    }
  };

  // Filter games
  const pendingGames = games.filter(game => !game.isCompleted && game.player === '0x0000000000000000000000000000000000000000');
  const userGames = games.filter(game => 
    address && (game.creator.toLowerCase() === address?.toLowerCase() || 
    game.player.toLowerCase() === address?.toLowerCase())
  );

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
        <div className="w-full max-w-6xl space-y-8">
          {/* Create Game Section */}
          <div className="text-center">
            <button
              onClick={handleStart}
              disabled={loading || isCreatingGame}
              className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-700 hover:via-orange-700 hover:to-red-700 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
            >
              {isCreatingGame ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating game...
                </>
              ) : loading ? (
                <>
                  <Sparkles />
                  Waiting for opponent...
                  <Sparkles />
                </>
              ) : (
                <>
                  <Sparkles />
                  Start Pack Battle!
                  <Sparkles />
                </>
              )}
            </button>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Games */}
            {pendingGames.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="text-orange-400" />
                  Join a Battle ({pendingGames.length})
                </h2>
                <div className="space-y-4">
                  {pendingGames.slice(0, 6).map((game) => (
                    <div
                      key={game.id}
                      className="bg-gradient-to-br from-black via-red-950/30 to-blue-950/30 border border-red-900/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-orange-400">
                          Game #{game.id}
                        </h3>
                        <div className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs">
                          Waiting
                        </div>
                      </div>
                      <div className="space-y-2 text-sm mb-4">
                        <div>
                          <span className="text-gray-400">Creator:</span>
                          <span className="text-white ml-2 font-mono">
                            {game.creator.slice(0, 6)}...{game.creator.slice(-4)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Entry Fee:</span>
                          <span className="text-green-400 ml-2">1 FLOW</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/battles/${game.id}`)}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Game
                        </button>
                        {address && game.creator.toLowerCase() !== address.toLowerCase() && (
                          <button
                            onClick={() => handleJoinGame(game.id)}
                            disabled={joiningGameId === game.id}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {joiningGameId === game.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Joining...
                              </>
                            ) : (
                              <>
                                <Sword className="w-4 h-4" />
                                Join Battle
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      {address && game.creator.toLowerCase() === address.toLowerCase() && (
                        <div className="w-full bg-blue-600/20 text-blue-400 text-center py-2 px-4 rounded-lg text-sm mt-2">
                          Your Game - Waiting for opponent
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Your Games */}
            {userGames.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="text-orange-400" />
                  Your Games ({userGames.length})
                </h2>
                <div className="space-y-4">
                  {userGames.slice(0, 6).map((game) => (
                    <div
                      key={game.id}
                      className="bg-gradient-to-br from-black via-orange-950/30 to-red-950/30 border border-orange-900/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-orange-400">
                          Game #{game.id}
                        </h3>
                        <div className={`px-2 py-1 rounded text-xs ${
                          game.isCompleted 
                            ? 'bg-green-600 text-green-100' 
                            : game.player !== '0x0000000000000000000000000000000000000000'
                            ? 'bg-blue-600 text-blue-100'
                            : 'bg-yellow-600 text-yellow-100'
                        }`}>
                          {game.isCompleted ? 'Completed' : game.player !== '0x0000000000000000000000000000000000000000' ? 'Active' : 'Waiting'}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">Your Role:</span>
                          <span className="text-orange-400 ml-2">
                            {game.creator.toLowerCase() === address?.toLowerCase() ? 'Creator' : 'Player'}
                          </span>
                        </div>
                        {game.isCompleted && (
                          <>
                            <div>
                              <span className="text-gray-400">Creator NFT:</span>
                              <span className="text-white ml-2">#{Number(game.availableNFTs[Number(game.creatorNFTIndex)])}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Player NFT:</span>
                              <span className="text-white ml-2">#{Number(game.availableNFTs[Number(game.playerNFTIndex)])}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Winner:</span>
                              <span className="text-green-400 ml-2">
                                {Number(game.availableNFTs[Number(game.creatorNFTIndex)]) > Number(game.availableNFTs[Number(game.playerNFTIndex)]) ? 'Creator' : 'Player'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => router.push(`/battles/${game.id}`)}
                          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Game Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Show message if no games */}
          {pendingGames.length === 0 && userGames.length === 0 && (
            <div className="text-center text-gray-400 mt-8">
              <p className="text-lg">No games available yet</p>
              <p className="text-sm">Be the first to create a battle!</p>
            </div>
          )}
        </div>
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