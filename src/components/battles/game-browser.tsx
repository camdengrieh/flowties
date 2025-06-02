'use client';

import { useState, useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import { packBattlesABI } from '@/lib/abis/PackBattles';
import { Loader2, Users, Trophy, Clock, Sword } from 'lucide-react';

const PACK_BATTLES_ADDRESS = process.env.NEXT_PUBLIC_PACK_BATTLES_ADDRESS || '0x9b4568cE546c1c54f15720783FE1744C20fF1914';

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

export default function GameBrowser() {
  const { address } = useAccount();
  const [joiningGameId, setJoiningGameId] = useState<number | null>(null);

  const { data: gameCounter } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'gameCounter',
  });

  const { data: gameFee } = useReadContract({
    address: PACK_BATTLES_ADDRESS as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'GAME_FEE',
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

  const { data: gamesData, isLoading } = useReadContracts({
    contracts: gameContracts,
  });

  const { writeContractAsync } = useWriteContract();

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

  const handleJoinGame = async (gameId: number) => {
    if (!gameFee) return;

    setJoiningGameId(gameId);
    try {
      await writeContractAsync({
        address: PACK_BATTLES_ADDRESS as `0x${string}`,
        abi: packBattlesABI,
        functionName: 'joinGame',
        args: [BigInt(gameId)],
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

  const pendingGames = games.filter(game => !game.isCompleted && game.player === '0x0000000000000000000000000000000000000000');
  const activeGames = games.filter(game => game.isActive && !game.isCompleted && game.player !== '0x0000000000000000000000000000000000000000');
  const completedGames = games.filter(game => game.isCompleted);

  const userGames = games.filter(game => 
    game.creator.toLowerCase() === address?.toLowerCase() || 
    game.player.toLowerCase() === address?.toLowerCase()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Games */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="text-orange-400" />
          Pending Games ({pendingGames.length})
        </h2>
        {pendingGames.length === 0 ? (
          <div className="text-gray-400 text-center p-8 bg-black/30 rounded-lg">
            No pending games available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingGames.map((game) => (
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
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Creator:</span>
                    <span className="text-white ml-2 font-mono">
                      {game.creator.slice(0, 6)}...{game.creator.slice(-4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">NFTs Available:</span>
                    <span className="text-orange-400 ml-2">{game.availableNFTs.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Entry Fee:</span>
                    <span className="text-green-400 ml-2">1 FLOW</span>
                  </div>
                </div>
                {address && game.creator.toLowerCase() !== address.toLowerCase() && (
                  <button
                    onClick={() => handleJoinGame(game.id)}
                    disabled={joiningGameId === game.id}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                {address && game.creator.toLowerCase() === address.toLowerCase() && (
                  <div className="w-full mt-4 bg-blue-600/20 text-blue-400 text-center py-2 px-4 rounded-lg text-sm">
                    Your Game - Waiting for opponent
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Games */}
      {activeGames.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="text-blue-400" />
            Active Games ({activeGames.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGames.map((game) => (
              <div
                key={game.id}
                className="bg-gradient-to-br from-black via-blue-950/30 to-purple-950/30 border border-blue-900/30 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-400">
                    Game #{game.id}
                  </h3>
                  <div className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs animate-pulse">
                    In Progress
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Creator:</span>
                    <span className="text-white ml-2 font-mono">
                      {game.creator.slice(0, 6)}...{game.creator.slice(-4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Player:</span>
                    <span className="text-white ml-2 font-mono">
                      {game.player.slice(0, 6)}...{game.player.slice(-4)}
                    </span>
                  </div>
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userGames.map((game) => (
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
                    <div>
                      <span className="text-gray-400">Creator NFT:</span>
                      <span className="text-white ml-2">#{Number(game.availableNFTs[Number(game.creatorNFTIndex)])}</span>
                    </div>
                  )}
                  {game.isCompleted && (
                    <div>
                      <span className="text-gray-400">Player NFT:</span>
                      <span className="text-white ml-2">#{Number(game.availableNFTs[Number(game.playerNFTIndex)])}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Games */}
      {completedGames.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="text-green-400" />
            Recent Completed Games ({completedGames.slice(-6).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGames.slice(-6).map((game) => (
              <div
                key={game.id}
                className="bg-gradient-to-br from-black via-green-950/30 to-blue-950/30 border border-green-900/30 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-green-400">
                    Game #{game.id}
                  </h3>
                  <div className="bg-green-600 text-green-100 px-2 py-1 rounded text-xs">
                    Completed
                  </div>
                </div>
                <div className="space-y-2 text-sm">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 