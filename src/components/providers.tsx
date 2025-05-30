'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PonderProvider } from '@ponder/react';
import { client } from '../lib/ponder';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider 
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email', 'wallet', 'google'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PonderProvider client={client}>
          {children}
        </PonderProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
} 