import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    if (!slug) {
      return NextResponse.json({ error: 'Collection slug is required' }, { status: 400 });
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
    const url = `https://api.opensea.io/api/v2/events/collection/${slug}?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
      // Cache for 2 minutes for collection activity
      next: { revalidate: 120 }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching collection events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection events' },
      { status: 500 }
    );
  }
} 