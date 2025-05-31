import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    
    if (!address) {
      return NextResponse.json({ error: 'Address or username is required' }, { status: 400 });
    }

    // Get OpenSea API key from environment
    const apiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenSea API key not configured' }, { status: 500 });
    }

    // Call OpenSea API
    const response = await fetch(`https://api.opensea.io/api/v2/accounts/${address}`, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
      // Cache for 10 minutes for user profiles
      next: { revalidate: 600 }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching account profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account profile' },
      { status: 500 }
    );
  }
} 