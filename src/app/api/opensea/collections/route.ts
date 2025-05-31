import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get OpenSea API key from environment
    const apiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenSea API key not configured' }, { status: 500 });
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Optional parameters from request
    const chain = searchParams.get('chain') || 'flow'; // Default to Flow
    const limit = searchParams.get('limit') || '20';
    const next = searchParams.get('next');
    const orderBy = searchParams.get('order_by');
    const includeHidden = searchParams.get('include_hidden');
    
    if (chain) queryParams.append('chain', chain);
    if (limit) queryParams.append('limit', limit);
    if (next) queryParams.append('next', next);
    if (orderBy) queryParams.append('order_by', orderBy);
    if (includeHidden) queryParams.append('include_hidden', includeHidden);

    // Call OpenSea API
    const url = `https://api.opensea.io/api/v2/collections?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
      // Cache for 15 minutes for collections list
      next: { revalidate: 900 }
    });

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
} 