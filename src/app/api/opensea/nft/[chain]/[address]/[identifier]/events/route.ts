import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chain: string; address: string; identifier: string }> }
) {
  try {
    const { chain, address, identifier } = await params;
    const { searchParams } = new URL(request.url);
    
    if (!chain || !address || !identifier) {
      return NextResponse.json({ 
        error: 'Chain, contract address, and token identifier are required' 
      }, { status: 400 });
    }

    // Get OpenSea API key from environment
    const apiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenSea API key not configured' }, { status: 500 });
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Optional parameters from request
    const eventType = searchParams.get('event_type');
    const after = searchParams.get('after');
    const before = searchParams.get('before');
    const limit = searchParams.get('limit') || '20';
    const next = searchParams.get('next');
    
    if (eventType) queryParams.append('event_type', eventType);
    if (after) queryParams.append('after', after);
    if (before) queryParams.append('before', before);
    if (limit) queryParams.append('limit', limit);
    if (next) queryParams.append('next', next);

    // Call OpenSea API
    const url = `https://api.opensea.io/api/v2/events/chain/${chain}/contract/${address}/nfts/${identifier}?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
      // Cache for 5 minutes for individual NFT activity
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
      }
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching NFT events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT events' },
      { status: 500 }
    );
  }
} 