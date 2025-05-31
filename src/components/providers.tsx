'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PonderProvider } from '@ponder/react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { flowMainnet } from 'wagmi/chains';
import { client } from '../lib/ponder';
import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

const queryClient = new QueryClient();

// Configure Wagmi
const config = createConfig({
  chains: [flowMainnet],
  transports: {
    [flowMainnet.id]: http("https://mainnet.evm.nodes.onflow.org"),
  },
});

// Component to handle user registration/sync
function UserSync() {
  const { ready, authenticated, user } = usePrivy();

  useEffect(() => {
    const syncUser = async () => {
      if (!ready || !authenticated || !user) return;

      try {
        // Register or update user in our database
        await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privyId: user.id,
            email: user.email?.address,
            wallet: user.wallet?.address,
            phone: user.phone?.number,
            linkedAccounts: user.linkedAccounts,
            createdAt: user.createdAt
          })
        });
      } catch (error) {
        console.error('Failed to sync user:', error);
      }
    };

    syncUser();
  }, [ready, authenticated, user]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider 
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          config={{
            loginMethods: ['email', 'wallet', 'google'],
            appearance: {
              theme: 'light',
              accentColor: '#676FFF',
            },
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
          }}
        >
          <PonderProvider client={client}>
            <UserSync />
            {children}
          </PonderProvider>
        </PrivyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 