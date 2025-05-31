import { NextResponse } from 'next/server';

interface TokenInput {
  contractAddress: string;
  tokenId: string;
}

const CHAIN = 'ethereum'; // adjust if you need a different chain

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tokens: TokenInput[] = Array.isArray(body.tokens) ? body.tokens : [];
    if (tokens.length === 0) {
      return NextResponse.json({ error: 'No tokens provided' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenSea API key not configured' }, { status: 500 });
    }

    // OpenSea does not offer a true batch endpoint for NFTs, so we fire requests in parallel.
    const fetches = tokens.map(({ contractAddress, tokenId }) =>
      fetch(
        `https://api.opensea.io/api/v2/chain/${CHAIN}/contract/${contractAddress}/nfts/${tokenId}`,
        {
          headers: {
            'X-API-KEY': apiKey,
            accept: 'application/json'
          }
        }
      ).then(async (r) => {
        if (!r.ok) {
          console.error('Failed to fetch NFT', contractAddress, tokenId, r.status);
          return null;
        }
        return r.json();
      })
    );

    const results = await Promise.all(fetches);
    const filtered = results.filter(Boolean);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error in OpenSea metadata batch:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 