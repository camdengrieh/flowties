import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface WatchlistItem {
  id: string;
  userAddress: string;
  type: 'collection' | 'user' | 'nft';
  target: string;
  metadata?: Record<string, unknown>;
  notifications?: Record<string, boolean>;
  addedAt: number;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  floorPrice?: string;
  totalVolume: string;
  owners: number;
}

interface User {
  id: string;
  totalVolumeSold: string;
  totalVolumeBought: string;
  totalItemsSold: number;
  totalItemsBought: number;
  lastActivity: number;
}

const WATCHLIST_QUERY = `
  query GetWatchlistData($collectionIds: [String!]!, $userIds: [String!]!) {
    collections(where: { id_in: $collectionIds }) {
      id
      name
      symbol
      totalVolume
      owners
      floorPrice
    }
    users(where: { id_in: $userIds }) {
      id
      totalVolumeSold
      totalVolumeBought
      totalItemsSold
      totalItemsBought
      lastActivity
    }
  }
`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('address');
  const type = searchParams.get('type'); // 'collections', 'users', 'nfts', or 'all'

  if (!userAddress) {
    return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
  }

  try {
    // In a real app, you'd store watchlist items in the user_subscription table
    // For now, we'll create mock watchlist items and enrich them with real data
    const mockWatchlistItems: WatchlistItem[] = [
      {
        id: `${userAddress}-collection-0x1234567890123456789012345678901234567890`,
        userAddress,
        type: 'collection',
        target: '0x1234567890123456789012345678901234567890',
        notifications: {
          enableSales: true,
          enableListings: false,
          enablePriceChanges: true,
          enableVolumeSpikes: true
        },
        addedAt: Math.floor(Date.now() / 1000) - 86400,
      },
      {
        id: `${userAddress}-user-0x9876543210987654321098765432109876543210`,
        userAddress,
        type: 'user',
        target: '0x9876543210987654321098765432109876543210',
        notifications: {
          enablePurchases: true,
          enableSales: true,
          enableListings: false,
          enableBids: true
        },
        addedAt: Math.floor(Date.now() / 1000) - 259200,
      },
      {
        id: `${userAddress}-nft-0x1234567890123456789012345678901234567890-1234`,
        userAddress,
        type: 'nft',
        target: '0x1234567890123456789012345678901234567890-1234',
        notifications: {
          enableSales: true,
          enableListings: true,
          enablePriceChanges: true,
          enableTransfers: false
        },
        addedAt: Math.floor(Date.now() / 1000) - 432000,
      }
    ];

    // Separate items by type
    const collectionItems = mockWatchlistItems.filter(item => item.type === 'collection');
    const userItems = mockWatchlistItems.filter(item => item.type === 'user');
    const nftItems = mockWatchlistItems.filter(item => item.type === 'nft');

    // Get collection and user IDs for enrichment
    const collectionIds = collectionItems.map(item => item.target);
    const userIds = userItems.map(item => item.target);

    let enrichedData: Record<string, unknown> = {};

    // Fetch real data from Ponder if we have items to enrich
    if (collectionIds.length > 0 || userIds.length > 0) {
      try {
        const ponderResponse = await fetch('http://localhost:42070/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: WATCHLIST_QUERY,
            variables: {
              collectionIds,
              userIds
            }
          })
        });

        if (ponderResponse.ok) {
          const ponderData = await ponderResponse.json();
          
          if (!ponderData.errors) {
            const collections = ponderData.data.collections || [];
            const users = ponderData.data.users || [];

            // Enrich collection items
            const enrichedCollections = collectionItems.map(item => {
              const collectionData = collections.find((c: Collection) => c.id === item.target);
              return {
                ...item,
                metadata: collectionData ? {
                  name: collectionData.name,
                  image: 'https://via.placeholder.com/64',
                  floorPrice: collectionData.floorPrice ? 
                    (Number(collectionData.floorPrice) / 1e18).toFixed(2) : '0',
                  volume24h: (Number(collectionData.totalVolume) / 1e18).toFixed(1),
                  owners: collectionData.owners
                } : {
                  name: 'Unknown Collection',
                  image: 'https://via.placeholder.com/64',
                  floorPrice: '0',
                  volume24h: '0',
                  owners: 0
                }
              };
            });

            // Enrich user items
            const enrichedUsers = userItems.map(item => {
              const userData = users.find((u: User) => u.id === item.target);
              return {
                ...item,
                metadata: userData ? {
                  alias: `Trader ${item.target.slice(0, 6)}...${item.target.slice(-4)}`,
                  totalVolume: (
                    (Number(userData.totalVolumeSold) + Number(userData.totalVolumeBought)) / 1e18
                  ).toFixed(1),
                  nftsOwned: userData.totalItemsBought - userData.totalItemsSold,
                  lastActivity: userData.lastActivity
                } : {
                  alias: `Trader ${item.target.slice(0, 6)}...${item.target.slice(-4)}`,
                  totalVolume: '0',
                  nftsOwned: 0,
                  lastActivity: 0
                }
              };
            });

            // Enrich NFT items (basic metadata for now)
            const enrichedNfts = nftItems.map(item => {
              const [, tokenId] = item.target.split('-');
              return {
                ...item,
                metadata: {
                  collection: 'Unknown Collection',
                  tokenId,
                  name: `NFT #${tokenId}`,
                  image: 'https://via.placeholder.com/128',
                  lastSalePrice: '0',
                  currentOwner: 'Unknown'
                }
              };
            });

            enrichedData = {
              collections: enrichedCollections,
              users: enrichedUsers,
              nfts: enrichedNfts
            };
          }
        }
      } catch (ponderError) {
        console.error('Ponder enrichment failed:', ponderError);
        // Fall back to basic metadata
      }
    }

    // If Ponder enrichment failed, provide basic metadata
    if (Object.keys(enrichedData).length === 0) {
      enrichedData = {
        collections: collectionItems.map(item => ({
          ...item,
          metadata: {
            name: 'Unknown Collection',
            image: 'https://via.placeholder.com/64',
            floorPrice: '0',
            volume24h: '0',
            owners: 0
          }
        })),
        users: userItems.map(item => ({
          ...item,
          metadata: {
            alias: `Trader ${item.target.slice(0, 6)}...${item.target.slice(-4)}`,
            totalVolume: '0',
            nftsOwned: 0,
            lastActivity: 0
          }
        })),
        nfts: nftItems.map(item => {
          const [, tokenId] = item.target.split('-');
          return {
            ...item,
            metadata: {
              collection: 'Unknown Collection',
              tokenId,
              name: `NFT #${tokenId}`,
              image: 'https://via.placeholder.com/128',
              lastSalePrice: '0',
              currentOwner: 'Unknown'
            }
          };
        })
      };
    }

    // Filter by type if specified
    if (type && type !== 'all') {
      const validTypes = ['collections', 'users', 'nfts'] as const;
      type ValidType = typeof validTypes[number];
      if (validTypes.includes(type as ValidType)) {
        const filteredData = { [type]: enrichedData[type as keyof typeof enrichedData] || [] };
        return NextResponse.json(filteredData);
      }
    }

    return NextResponse.json(enrichedData);

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

    // In production, this would insert into your Ponder database using a mutation
    // For now, we'll simulate the creation
    const watchlistItem: WatchlistItem = {
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