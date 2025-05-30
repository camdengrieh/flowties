import { NextRequest, NextResponse } from 'next/server';

// This would connect to your Ponder backend database in production
// For demo purposes, we'll return mock data

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('address');
  const limit = parseInt(searchParams.get('limit') || '20');
  const unreadOnly = searchParams.get('unread') === 'true';

  if (!userAddress) {
    return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
  }

  // Mock notifications - in production this would query your Ponder database
  const mockNotifications = [
    {
      id: 'notif_1704067200_abc123',
      userAddress,
      type: 'sale_completed',
      title: 'NFT Sold!',
      message: 'Your NFT #1234 from collection 0x1234...5678 sold for 5.5 FLOW',
      data: JSON.stringify({
        collection: '0x1234567890123456789012345678901234567890',
        tokenId: '1234',
        price: '5500000000000000000',
        buyer: '0x9876543210987654321098765432109876543210'
      }),
      inAppSent: true,
      smsSent: false,
      telegramSent: false,
      createdAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      readAt: null,
    },
    {
      id: 'notif_1704063600_def456',
      userAddress,
      type: 'volume_surge',
      title: 'Volume Surge Alert!',
      message: 'Collection 0x1234...5678 is experiencing high volume!',
      data: JSON.stringify({
        collection: '0x1234567890123456789012345678901234567890',
        volume24h: '125000000000000000000',
        price: '5500000000000000000'
      }),
      inAppSent: true,
      smsSent: true,
      telegramSent: false,
      createdAt: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      readAt: Math.floor(Date.now() / 1000) - 3000, // Read 50 min ago
    },
    {
      id: 'notif_1704060000_ghi789',
      userAddress,
      type: 'offer_received',
      title: 'New Offer Received!',
      message: 'You received an offer of 4.8 FLOW for NFT #5678',
      data: JSON.stringify({
        collection: '0x9876543210987654321098765432109876543210',
        tokenId: '5678',
        price: '4800000000000000000',
        offerer: '0x1111222233334444555566667777888899990000'
      }),
      inAppSent: true,
      smsSent: false,
      telegramSent: true,
      createdAt: Math.floor(Date.now() / 1000) - 10800, // 3 hours ago
      readAt: null,
    }
  ];

  // Filter unread notifications if requested
  const notifications = unreadOnly 
    ? mockNotifications.filter(n => !n.readAt)
    : mockNotifications;

  return NextResponse.json({ 
    notifications: notifications.slice(0, limit),
    total: notifications.length,
    unreadCount: mockNotifications.filter(n => !n.readAt).length
  });
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAsRead } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' }, 
        { status: 400 }
      );
    }

    // In production, this would update the notification in your Ponder database
    const updatedNotification = {
      id: notificationId,
      readAt: markAsRead ? Math.floor(Date.now() / 1000) : null,
    };

    return NextResponse.json({ 
      success: true, 
      notification: updatedNotification,
      message: markAsRead ? 'Notification marked as read' : 'Notification marked as unread'
    });

  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }
}

// Mark all notifications as read for a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress is required' }, 
        { status: 400 }
      );
    }

    // In production, this would update all unread notifications for the user
    return NextResponse.json({ 
      success: true,
      message: 'All notifications marked as read',
      updatedCount: 2 // Mock number
    });

  } catch (error) {
    console.error('Bulk notification update error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }
} 