import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
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
    const chain = searchParams.get('chain') || 'flow'; // Default to Flow
    const limit = searchParams.get('limit') || '20';
    const next = searchParams.get('next');
    
    if (eventType) queryParams.append('event_type', eventType);
    if (chain) queryParams.append('chain', chain);
    if (limit) queryParams.append('limit', limit);
    if (next) queryParams.append('next', next);

    // Call OpenSea API
    const url = `https://api.opensea.io/api/v2/events/accounts/${address}?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
      // Cache for 2 minutes for user activity
      next: { revalidate: 120 }
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
    console.error('Error fetching account events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account events' },
      { status: 500 }
    );
  }
} 