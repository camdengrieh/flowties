import { NextResponse } from 'next/server';

interface Nft {
  identifier: string;
  name: string;
  image_url: string;
}

const COLLECTION_SLUG = 'nba-top-shot';
const OPENSEA_ENDPOINT = `https://api.opensea.io/api/v2/collection/${COLLECTION_SLUG}/nfts?limit=50`;

async function fetchRandomNft(): Promise<Nft | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY || '';
  const res = await fetch(OPENSEA_ENDPOINT, {
    headers: {
      'X-API-KEY': apiKey,
      accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.nfts?.length) return null;
  const nft = data.nfts[Math.floor(Math.random() * data.nfts.length)];
  return nft as Nft;
}

function deriveStats(tokenId: string) {
  // simple deterministic pseudo stats from token id
  const num = parseInt(tokenId, 10) || Math.floor(Math.random() * 10000);
  const attack = 50 + (num % 50);
  const defense = 50 + ((num >> 3) % 50);
  return { attack, defense };
}

export async function POST() {
  // Simulate oracle latency of 2s
  await new Promise((r) => setTimeout(r, 2000));

  const [playerNft, opponentNft] = await Promise.all([fetchRandomNft(), fetchRandomNft()]);

  if (!playerNft || !opponentNft) {
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 });
  }

  const playerStats = deriveStats(playerNft.identifier);
  const opponentStats = deriveStats(opponentNft.identifier);

  return NextResponse.json({
    playerCard: {
      id: playerNft.identifier,
      name: playerNft.name || `Top Shot #${playerNft.identifier}`,
      image: playerNft.image_url,
      attack: playerStats.attack,
      defense: playerStats.defense,
    },
    opponentCard: {
      id: opponentNft.identifier,
      name: opponentNft.name || `Top Shot #${opponentNft.identifier}`,
      image: opponentNft.image_url,
      attack: opponentStats.attack,
      defense: opponentStats.defense,
    },
  });
} 