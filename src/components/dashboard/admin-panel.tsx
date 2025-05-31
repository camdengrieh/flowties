import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchPendingTransactions } from 'wagmi';
import { packBattlesABI } from '../../lib/abis/PackBattles';
import NFTSelector from '../admin/nft-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminPanelProps {
  contractAddress: string;
}

export default function AdminPanel({ contractAddress }: AdminPanelProps) {
  const { address } = useAccount();
  const [withdrawTokenId, setWithdrawTokenId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Contract reads
  const { data: owner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'owner',
  });

  const { data: totalNFTs } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'totalAvailableNFTs',
  });

  const { data: reservedNFTs } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'reservedNFTs',
  });

  const { data: availableNFTs } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: packBattlesABI,
    functionName: 'getAvailableNFTs',
  });

  // Contract writes
  const { writeContractAsync } = useWriteContract();

  // Watch pending transactions
  useWatchPendingTransactions({
    onTransactions: () => {
      // Reset loading states when transactions complete
      setIsWithdrawing(false);
      setSuccess('Transaction completed successfully');
    },
  });


  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsWithdrawing(true);

    try {
      await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: packBattlesABI,
        functionName: 'withdrawNFT',
        args: [BigInt(withdrawTokenId)],
      });
      
      setWithdrawTokenId('');
    } catch (err) {
      console.error('Error withdrawing NFT:', err);
      setError('Failed to withdraw NFT. Make sure you are the owner and the NFT is available.');
      setIsWithdrawing(false);
    }
  }

  if (!owner || !address) {
    return (
      <div className="p-6 bg-black/50 rounded-xl border border-red-900/30">
        <div className="animate-pulse text-orange-500">Loading admin panel...</div>
      </div>
    );
  }

  if (owner !== address) {
    return null;
  }

  const stats = {
    totalNFTs: Number(totalNFTs || 0),
    reservedNFTs: Number(reservedNFTs || 0),
    unreservedNFTs: Number(totalNFTs || 0) - Number(reservedNFTs || 0),
    availableNFTs: (availableNFTs || []).map((n: bigint) => Number(n))
  };

  return (
    <div className="p-6 bg-black/50 rounded-xl border border-red-900/30">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">Admin Panel</h2>
      
      {/* Contract Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg">
          <h3 className="text-sm text-orange-400">Total NFTs</h3>
          <p className="text-2xl font-bold text-white">{stats.totalNFTs}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg">
          <h3 className="text-sm text-orange-400">Reserved NFTs</h3>
          <p className="text-2xl font-bold text-white">{stats.reservedNFTs}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg">
          <h3 className="text-sm text-orange-400">Unreserved NFTs</h3>
          <p className="text-2xl font-bold text-white">{stats.unreservedNFTs}</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-500 rounded-lg text-green-400">
          {success}
        </div>
      )}

      <Tabs defaultValue="add" className="space-y-6">
        <TabsList className="bg-black/30 border border-red-900/30">
          <TabsTrigger value="add" className="data-[state=active]:bg-orange-600">
            Add NFTs
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="data-[state=active]:bg-orange-600">
            Withdraw NFTs
          </TabsTrigger>
          <TabsTrigger value="available" className="data-[state=active]:bg-orange-600">
            Available NFTs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-4 pt-4">
          <NFTSelector 
            collection="nba-top-shot"
            onSuccess={() => {
              setSuccess('NFTs added successfully');
              // You might want to refresh the contract stats here
            }}
          />
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4 pt-4">
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Token ID to Withdraw</label>
              <input
                type="number"
                value={withdrawTokenId}
                onChange={(e) => setWithdrawTokenId(e.target.value)}
                className="w-full bg-black/50 border border-orange-900/50 rounded-lg p-2 text-white"
                placeholder="Enter token ID"
                required
                disabled={isWithdrawing}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={isWithdrawing}
            >
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw NFT'}
            </button>
          </form>
        </TabsContent>

        <TabsContent value="available" className="space-y-4 pt-4">
          <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
            {stats.availableNFTs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {stats.availableNFTs.map((tokenId: number) => (
                  <div key={tokenId} className="text-center p-2 bg-orange-900/20 rounded">
                    #{tokenId}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No NFTs available</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 