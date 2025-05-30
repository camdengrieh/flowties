import { NextRequest, NextResponse } from 'next/server';

// This would connect to your Ponder backend database in production
// For demo purposes, we'll return mock data

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('address');
  const type = searchParams.get('type'); // 'collections', 'users', 'nfts', or 'all'

  if (!userAddress) {
    return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
  }

  // Mock watchlist data - in production this would query your Ponder database
  const mockWatchlist = {
    collections: [
      {
        id: `${userAddress}-collection-0x1234567890123456789012345678901234567890`,
        userAddress,
        type: 'collection',
        target: '0x1234567890123456789012345678901234567890',
        metadata: {
          name: 'Flow Punks',
          image: 'https://via.placeholder.com/64',
          floorPrice: '2.5',
          volume24h: '125.7',
          owners: 3421
        },
        notifications: {
          enableSales: true,
          enableListings: false,
          enablePriceChanges: true,
          enableVolumeSpikes: true
        },
        addedAt: Math.floor(Date.now() / 1000) - 86400,
      },
      {
        id: `${userAddress}-collection-0x2345678901234567890123456789012345678901`,
        userAddress,
        type: 'collection',
        target: '0x2345678901234567890123456789012345678901',
        metadata: {
          name: 'Flow Bears',
          image: 'https://via.placeholder.com/64',
          floorPrice: '1.8',
          volume24h: '89.3',
          owners: 2156
        },
        notifications: {
          enableSales: false,
          enableListings: true,
          enablePriceChanges: true,
          enableVolumeSpikes: false
        },
        addedAt: Math.floor(Date.now() / 1000) - 172800,
      }
    ],
    users: [
      {
        id: `${userAddress}-user-0x9876543210987654321098765432109876543210`,
        userAddress,
        type: 'user',
        target: '0x9876543210987654321098765432109876543210',
        metadata: {
          alias: 'Top Trader',
          totalVolume: '2453.7',
          nftsOwned: 67,
          lastActivity: Math.floor(Date.now() / 1000) - 3600
        },
        notifications: {
          enablePurchases: true,
          enableSales: true,
          enableListings: false,
          enableBids: true
        },
        addedAt: Math.floor(Date.now() / 1000) - 259200,
      }
    ],
    nfts: [
      {
        id: `${userAddress}-nft-0x1234567890123456789012345678901234567890-1234`,
        userAddress,
        type: 'nft',
        target: '0x1234567890123456789012345678901234567890-1234',
        metadata: {
          collection: 'Flow Punks',
          tokenId: '1234',
          name: 'Flow Punk #1234',
          image: 'https://via.placeholder.com/128',
          lastSalePrice: '5.5',
          currentOwner: '0x1111222233334444555566667777888899990000'
        },
        notifications: {
          enableSales: true,
          enableListings: true,
          enablePriceChanges: true,
          enableTransfers: false
        },
        addedAt: Math.floor(Date.now() / 1000) - 432000,
      }
    ]
  };

  // Filter by type if specified
  if (type && type !== 'all') {
    const validTypes = ['collections', 'users', 'nfts'] as const;
    type ValidType = typeof validTypes[number];
    if (validTypes.includes(type as ValidType)) {
      const filteredData = { [type]: mockWatchlist[type as keyof typeof mockWatchlist] || [] };
      return NextResponse.json(filteredData);
    }
  }

  return NextResponse.json(mockWatchlist);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, type, target, metadata, notifications } = body;

    if (!userAddress || !type || !target) {
      return NextResponse.json(
        { error: 'userAddress, type, and target are required' }, 
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

    // In production, this would insert into your Ponder database
    const watchlistItem = {
      id: `${userAddress}-${type}-${target}`,
      userAddress,
      type,
      target,
      metadata: metadata || {},
      notifications: notifications || {},
      addedAt: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json({ 
      success: true, 
      item: watchlistItem,
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
    const { itemId, notifications } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' }, 
        { status: 400 }
      );
    }

    // In production, this would update the watchlist item in your Ponder database
    return NextResponse.json({ 
      success: true,
      message: 'Watchlist item updated successfully',
      updatedNotifications: notifications
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

  if (!itemId) {
    return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
  }

  // In production, this would delete from your Ponder database
  return NextResponse.json({ 
    success: true,
    message: 'Item removed from watchlist successfully'
  });
} 