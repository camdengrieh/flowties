import { NextRequest, NextResponse } from 'next/server';

// This would connect to your Ponder backend database in production
// For demo purposes, we'll return mock data

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userAddress = searchParams.get('address');

  if (!userAddress) {
    return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
  }

  // Mock user subscriptions - in production this would query your Ponder database
  const subscriptions = [
    {
      id: `${userAddress}-offers_received-null`,
      userAddress,
      subscriptionType: 'offers_received',
      target: null,
      isActive: true,
      enableInApp: true,
      enableSms: false,
      enableTelegram: false,
      createdAt: Date.now() / 1000,
    },
    {
      id: `${userAddress}-sales_completed-null`,
      userAddress,
      subscriptionType: 'sales_completed', 
      target: null,
      isActive: true,
      enableInApp: true,
      enableSms: true,
      enableTelegram: false,
      smsNumber: '+1234567890',
      createdAt: Date.now() / 1000,
    }
  ];

  return NextResponse.json({ subscriptions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userAddress, 
      subscriptionType, 
      target, 
      enableInApp = true, 
      enableSms = false, 
      enableTelegram = false,
      smsNumber,
      telegramChatId 
    } = body;

    if (!userAddress || !subscriptionType) {
      return NextResponse.json(
        { error: 'userAddress and subscriptionType are required' }, 
        { status: 400 }
      );
    }

    // Validate subscription types
    const validTypes = ['user_activity', 'collection_surge', 'offers_received', 'sales_completed'];
    if (!validTypes.includes(subscriptionType)) {
      return NextResponse.json(
        { error: 'Invalid subscription type' }, 
        { status: 400 }
      );
    }

    // In production, this would insert into your Ponder database
    const subscription = {
      id: `${userAddress}-${subscriptionType}-${target || 'null'}`,
      userAddress,
      subscriptionType,
      target,
      isActive: true,
      enableInApp,
      enableSms,
      enableTelegram,
      smsNumber,
      telegramChatId,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json({ 
      success: true, 
      subscription,
      message: 'Subscription created successfully'
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get('id');

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
  }

  // In production, this would delete from your Ponder database
  return NextResponse.json({ 
    success: true,
    message: 'Subscription deleted successfully'
  });
} 