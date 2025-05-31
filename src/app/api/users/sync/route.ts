import { NextRequest, NextResponse } from 'next/server';

interface LinkedAccount {
  type: string;
  address?: string;
  email?: string;
  phone?: string;
  subject?: string;
}

interface UserSyncRequest {
  privyId: string;
  email?: string;
  wallet?: string;
  phone?: string;
  linkedAccounts: LinkedAccount[];
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UserSyncRequest = await request.json();
    const { privyId, email, wallet, phone, linkedAccounts, createdAt } = body;

    if (!privyId) {
      return NextResponse.json({ error: 'Privy ID is required' }, { status: 400 });
    }

    // In production, this would interact with your Ponder database
    // For now, we'll just log the user data
    console.log('Syncing user:', {
      privyId,
      email,
      wallet,
      phone,
      linkedAccounts: linkedAccounts.length,
      createdAt
    });

    // In production, you would:
    // 1. Check if user exists in your database
    // 2. Create new user or update existing user
    // 3. Create default subscriptions for new users
    
    return NextResponse.json({ 
      success: true, 
      message: 'User synced successfully',
      userId: privyId,
      isNewUser: true // For demo purposes
    });

  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user data' }, 
      { status: 500 }
    );
  }
} 