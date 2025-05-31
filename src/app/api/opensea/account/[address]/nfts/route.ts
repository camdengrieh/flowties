import { NextResponse } from 'next/server';

const OPENSEA_API_KEY = process.env.NEXT_PUBLIC_OPENSEA_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const chain = searchParams.get('chain') || 'flow';

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection parameter is required' },
        { status: 400 }
      );
    }

    if (!OPENSEA_API_KEY) {
      return NextResponse.json(
        { error: 'OpenSea API key not configured' },
        { status: 500 }
      );
    }

    const url = `https://api.opensea.io/api/v2/chain/${chain}/account/${params.address}/nfts?collection=${collection}`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'x-api-key': OPENSEA_API_KEY
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `OpenSea API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
} 