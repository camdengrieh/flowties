'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Trophy, Clock, ArrowLeft, User, Users, Play, Sword } from 'lucide-react';
import { useReadContract, useWriteContract, useWatchContractEvent, useAccount } from 'wagmi';
import { packBattlesABI } from '@/lib/abis/PackBattles';
import DynamicBattleStage from './dynamic-battle-stage';

const PACK_BATTLES_ADDRESS = process.env.NEXT_PUBLIC_PACK_BATTLES_ADDRESS || '0x9b4568cE546c1c54f15720783FE1744C20fF1914';

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

interface GameDetailProps {
  gameId: string;
}

export default function GameDetail({ gameId }: GameDetailProps) {
  const router = useRouter();
  const { address } = useAccount();
  const [payload, setPayload] = useState<BattlePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);

  const gameIdNumber = parseInt(gameId);

  // Contract read for the specific game
  const { data: gameData, isLoading: isLoadingGame } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'getGame',
    args: [BigInt(gameIdNumber)],
    query: {
      refetchInterval: 5000,
    },
  });

  // Read game fee for joining
  const { data: gameFee } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'GAME_FEE',
  });

  // Contract write for joining game
  const { writeContractAsync, isPending: isJoiningPack } = useWriteContract();

  const game = gameData as Game | undefined;

  // Watch for GameJoined events
  useWatchContractEvent({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    eventName: 'GameJoined',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { args } = log;
        if (args && args.gameId && Number(args.gameId) === gameIdNumber) {
          // Game was joined, refresh will happen automatically due to refetchInterval
          setJoiningGame(false);
        }
      });
    },
  });

  // Watch for GameCompleted events
  useWatchContractEvent({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    eventName: 'GameCompleted',
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { args } = log;
        if (args && args.gameId && Number(args.gameId) === gameIdNumber) {
          // Game completed, battle results will be loaded automatically
        }
      });
    },
  });

  // Join game function
  const handleJoinGame = async () => {
    if (!gameFee || !address || !game) return;

    setJoiningGame(true);
    try {
      await writeContractAsync({
        address: PACK_BATTLES_ADDRESS as `0x${string}`,
        abi: packBattlesABI,
        functionName: 'joinGame',
        args: [BigInt(gameIdNumber)],
        value: gameFee,
      }, {
        onSuccess: () => {
        },
        onError: () => {
          setJoiningGame(false);
        },
      });
    } catch (error) {
      console.error('Failed to join game:', error);
      setJoiningGame(false);
    }
  };

  // Check if current user can join this game
  const canJoinGame = () => {
    if (!game || !address) return false;
    if (game.isCompleted) return false;
    if (game.player !== '0x0000000000000000000000000000000000000000') return false;
    if (game.creator.toLowerCase() === address.toLowerCase()) return false;
    return true;
  };

  // Fetch battle results if game is completed
  useEffect(() => {
    const fetchBattleResults = async () => {
      if (!game || !game.isCompleted) return;

      setLoading(true);
      try {
        const creatorNFT = game.availableNFTs[Number(game.creatorNFTIndex)];
        const playerNFT = game.availableNFTs[Number(game.playerNFTIndex)];

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
      } catch (error) {
        console.error('Failed to fetch battle results:', error);
        setError('Failed to load battle results');
      } finally {
        setLoading(false);
      }
    };

    fetchBattleResults();
  }, [game]);

  const handleReset = () => {
    setShowReplay(false);
  };

  const handleReplayClick = () => {
    setShowReplay(true);
  };

  if (isLoadingGame) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-400" />
          <p className="text-white">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Game Not Found</h1>
          <p className="text-gray-400 mb-6">The game with ID {gameId} could not be found.</p>
          <button
            onClick={() => router.push('/battles')}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Battles
          </button>
        </div>
      </div>
    );
  }

  // Determine winner if game is completed
  const getWinner = () => {
    if (!game.isCompleted) return null;
    
    const creatorNFT = game.availableNFTs[Number(game.creatorNFTIndex)];
    const playerNFT = game.availableNFTs[Number(game.playerNFTIndex)];
    
    return creatorNFT > playerNFT ? game.creator : game.player;
  };

  const winner = getWinner();

  // If user clicked replay and we have payload, show battle results
  if (showReplay && payload) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Breadcrumb */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-400">
              <button
                onClick={() => router.push('/battles')}
                className="hover:text-white transition-colors"
              >
                Battles
              </button>
              <span>/</span>
              <button
                onClick={() => setShowReplay(false)}
                className="hover:text-white transition-colors"
              >
                Game #{gameId}
              </button>
              <span>/</span>
              <span className="text-orange-400">Battle Replay</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent mb-2 flex items-center gap-2 justify-center">
              <Sparkles className="text-orange-400" />
              Game #{gameId} - Battle Replay
              <Sparkles className="text-orange-400" />
            </h1>
            <p className="text-gray-400">Watch the epic battle unfold!</p>
          </div>

          {/* Battle Stage */}
          <DynamicBattleStage initialData={payload} onReset={handleReset} />
        </div>
      </div>
    );
  }

  // Show pending state or completed state without battle results yet
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <button
            onClick={() => router.push('/battles')}
            className="mb-4 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Battles
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent mb-2 flex items-center gap-2 justify-center">
            <Sparkles className="text-orange-400" />
            Game #{gameId}
            <Sparkles className="text-orange-400" />
          </h1>
        </div>

        {/* Game Details Card */}
        <div className="bg-gradient-to-br from-black via-red-950/30 to-blue-950/30 border border-red-900/30 rounded-xl p-8 shadow-2xl">
          {/* Game Status */}
          <div className="text-center mb-8">
            {!game.isCompleted && game.player === '0x0000000000000000000000000000000000000000' ? (
              <div className="inline-flex items-center gap-2 bg-yellow-600 text-yellow-100 px-4 py-2 rounded-lg text-lg font-semibold">
                <Clock className="w-5 h-5" />
                Waiting for Player
              </div>
            ) : !game.isCompleted ? (
              <div className="inline-flex items-center gap-2 bg-blue-600 text-blue-100 px-4 py-2 rounded-lg text-lg font-semibold">
                <Users className="w-5 h-5" />
                Game in Progress
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-green-600 text-green-100 px-4 py-2 rounded-lg text-lg font-semibold">
                <Trophy className="w-5 h-5" />
                Game Completed
              </div>
            )}
          </div>

          {/* Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Creator */}
            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Creator
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Address:</span>
                  <div className="text-white font-mono text-sm mt-1">
                    {game.creator.slice(0, 6)}...{game.creator.slice(-4)}
                  </div>
                </div>
                {address && game.creator.toLowerCase() === address.toLowerCase() && (
                  <div className="bg-blue-600/20 text-blue-400 text-center py-1 px-2 rounded text-sm">
                    You
                  </div>
                )}
                {game.isCompleted && winner === game.creator && (
                  <div className="bg-green-600/20 text-green-400 text-center py-1 px-2 rounded text-sm flex items-center justify-center gap-1">
                    <Trophy className="w-4 h-4" />
                    Winner
                  </div>
                )}
              </div>
            </div>

            {/* Player */}
            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Player
              </h3>
              <div className="space-y-2">
                {game.player === '0x0000000000000000000000000000000000000000' ? (
                  <div className="text-gray-500 italic">Waiting for player to join...</div>
                ) : (
                  <>
                    <div>
                      <span className="text-gray-400">Address:</span>
                      <div className="text-white font-mono text-sm mt-1">
                        {game.player.slice(0, 6)}...{game.player.slice(-4)}
                      </div>
                    </div>
                    {address && game.player.toLowerCase() === address.toLowerCase() && (
                      <div className="bg-blue-600/20 text-blue-400 text-center py-1 px-2 rounded text-sm">
                        You
                      </div>
                    )}
                    {game.isCompleted && winner === game.player && (
                      <div className="bg-green-600/20 text-green-400 text-center py-1 px-2 rounded text-sm flex items-center justify-center gap-1">
                        <Trophy className="w-4 h-4" />
                        Winner
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="bg-black/30 rounded-lg p-6 border border-gray-700 mb-8">
            <h3 className="text-lg font-semibold text-orange-400 mb-4">Game Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Entry Fee:</span>
                <div className="text-green-400 font-semibold">1 FLOW</div>
              </div>
              <div>
                <span className="text-gray-400">Total Prize Pool:</span>
                <div className="text-green-400 font-semibold">2 Moment NFTs</div>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <div className="text-white font-semibold">
                  {!game.isCompleted && game.player === '0x0000000000000000000000000000000000000000' 
                    ? 'Waiting for Player' 
                    : !game.isCompleted 
                    ? 'In Progress' 
                    : 'Completed'}
                </div>
              </div>
            </div>
          </div>

          {/* Replay Button for Completed Games */}
          {game.isCompleted && payload && !loading && (
            <div className="text-center">
              <button
                onClick={handleReplayClick}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <Play className="w-6 h-6" />
                <span className="text-lg">Watch Battle Replay</span>
                <Sparkles className="w-6 h-6" />
              </button>
              <p className="text-gray-400 mt-3">
                See how the battle unfolded between the cards!
              </p>
            </div>
          )}

          {/* Pending Animation */}
          {!game.isCompleted && (
            <div className="text-center space-y-4">
              {/* Join Battle Button */}
              {canJoinGame() && (
                <div className="mb-6">
                  <button
                    onClick={handleJoinGame}
                    disabled={joiningGame || isJoiningPack}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    {joiningGame || isJoiningPack ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-lg">Joining Battle...</span>
                      </>
                    ) : (
                      <>
                        <Sword className="w-6 h-6" />
                        <span className="text-lg">Join Battle (1 FLOW)</span>
                        <Sparkles className="w-6 h-6" />
                      </>
                    )}
                  </button>
                  <p className="text-gray-400 mt-3">
                    Join this battle and compete for the prize pool!
                  </p>
                </div>
              )}
              
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-lg px-6 py-4">
                <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                <span className="text-white font-semibold">
                  {game.player === '0x0000000000000000000000000000000000000000' 
                    ? 'Waiting for an opponent to join...' 
                    : 'Battle in progress...'}
                </span>
                <Sparkles className="w-6 h-6 text-orange-400 animate-pulse" />
              </div>
            </div>
          )}

          {/* Completed but loading results */}
          {game.isCompleted && !payload && loading && (
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-lg px-6 py-4">
                <Loader2 className="w-6 h-6 animate-spin text-green-400" />
                <span className="text-white font-semibold">Loading battle results...</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center">
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-red-400">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 