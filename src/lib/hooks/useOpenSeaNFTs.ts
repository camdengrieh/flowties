import { useState, useEffect } from 'react';

interface NFT {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
  name: string;
  description: string;
  image_url: string;
  metadata_url: string;
  created_at: string;
  updated_at: string;
  is_disabled: boolean;
  is_nsfw: boolean;
}

interface OpenSeaResponse {
  nfts: NFT[];
  next: string | null;
}

export function useOpenSeaNFTs(address: string, collection: string) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address || !collection) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/opensea/account/${address}/nfts?collection=${collection}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch NFTs');
        }

        const data: OpenSeaResponse = await response.json();
        setNfts(data.nfts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
        console.error('Error fetching NFTs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [address, collection]);

  return { nfts, isLoading, error };
} 