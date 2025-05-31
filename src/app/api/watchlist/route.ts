import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface WatchlistItem {
  id: string;
  userPrivyId: string;
  type: 'collection' | 'user' | 'nft';
  target: string;
  metadata?: Record<string, unknown>;
  notifications?: Record<string, boolean>;
  addedAt: number;
}

interface WatchlistData {
  collections?: WatchlistItem[];
  users?: WatchlistItem[];
  nfts?: WatchlistItem[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const privyId = searchParams.get('privyId');
  const type = searchParams.get('type'); // 'collections', 'users', 'nfts', or 'all'

  if (!privyId) {
    return NextResponse.json({ error: 'Privy ID parameter required' }, { status: 400 });
  }

  try {
    // In production, query your Ponder database:
    // SELECT * FROM UserWatchlist WHERE userPrivyId = $1
    // AND (type = $2 OR $2 = 'all')

    console.log('Fetching watchlist for user:', { privyId, type });

    // For now, return empty watchlist until connected to real database
    const watchlistData: WatchlistData = {
      collections: [],
      users: [],
      nfts: []
    };

    // Filter by type if specified
    if (type && type !== 'all') {
      const validTypes = ['collections', 'users', 'nfts'] as const;
      type ValidType = typeof validTypes[number];
      if (validTypes.includes(type as ValidType)) {
        const filteredData = { [type]: watchlistData[type as keyof typeof watchlistData] || [] };
        return NextResponse.json(filteredData);
      }
    }

    return NextResponse.json(watchlistData);

  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privyId, type, target, metadata, notifications } = body;

    if (!privyId || !type || !target) {
      return NextResponse.json(
        { error: 'privyId, type, and target are required' }, 
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['collection', 'user', 'nft'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be collection, user, or nft' }, 
        { status: 400 }
      );
    }

    // In production, insert into your Ponder database:
    // INSERT INTO UserWatchlist (userPrivyId, type, target, metadata, notifications, addedAt)
    // VALUES ($1, $2, $3, $4, $5, $6)

    console.log('Adding to watchlist:', {
      privyId,
      type,
      target,
      metadata,
      notifications
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Item added to watchlist successfully'
    });

  } catch (error) {
    console.error('Watchlist creation error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, notifications, privyId } = body;

    if (!itemId || !privyId) {
      return NextResponse.json(
        { error: 'itemId and privyId are required' }, 
        { status: 400 }
      );
    }

    // In production, update the watchlist item in your Ponder database:
    // UPDATE UserWatchlist 
    // SET notifications = $1 
    // WHERE id = $2 AND userPrivyId = $3

    console.log('Updating watchlist item:', { itemId, notifications, privyId });

    return NextResponse.json({ 
      success: true,
      message: 'Watchlist item updated successfully'
    });

  } catch (error) {
    console.error('Watchlist update error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('id');
  const privyId = searchParams.get('privyId');

  if (!itemId || !privyId) {
    return NextResponse.json({ error: 'Item ID and Privy ID required' }, { status: 400 });
  }

  try {
    // In production, delete from your Ponder database:
    // DELETE FROM UserWatchlist 
    // WHERE id = $1 AND userPrivyId = $2

    console.log('Removing from watchlist:', { itemId, privyId });

    return NextResponse.json({ 
      success: true,
      message: 'Item removed from watchlist successfully'
    });

  } catch (error) {
    console.error('Failed to remove from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
} 