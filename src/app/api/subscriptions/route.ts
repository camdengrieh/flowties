import { NextRequest, NextResponse } from 'next/server';

// This would connect to your Ponder backend database in production

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const privyId = searchParams.get('privyId');

  if (!privyId) {
    return NextResponse.json({ error: 'Privy ID parameter required' }, { status: 400 });
  }

  try {
    // In production, query your Ponder database:
    // SELECT * FROM UserSubscription WHERE userPrivyId = $1

    console.log('Fetching subscriptions for user:', privyId);

    // For now, return empty subscriptions until connected to real database
    const subscriptions: unknown[] = [];

    return NextResponse.json({ subscriptions });

  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      privyId, 
      subscriptionType, 
      target, 
      enableInApp = true, 
      enableSms = false, 
      enableTelegram = false,
      smsNumber,
      telegramChatId 
    } = body;

    if (!privyId || !subscriptionType) {
      return NextResponse.json(
        { error: 'privyId and subscriptionType are required' }, 
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

    // In production, insert into your Ponder database:
    // INSERT INTO UserSubscription (userPrivyId, subscriptionType, target, ...)
    // VALUES ($1, $2, $3, ...)

    console.log('Creating subscription:', {
      privyId,
      subscriptionType,
      target,
      enableInApp,
      enableSms,
      enableTelegram,
      smsNumber,
      telegramChatId
    });

    return NextResponse.json({ 
      success: true, 
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
  const privyId = searchParams.get('privyId');

  if (!subscriptionId || !privyId) {
    return NextResponse.json({ error: 'Subscription ID and Privy ID required' }, { status: 400 });
  }

  try {
    // In production, delete from your Ponder database:
    // DELETE FROM UserSubscription 
    // WHERE id = $1 AND userPrivyId = $2

    console.log('Deleting subscription:', { subscriptionId, privyId });

    return NextResponse.json({ 
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
} 