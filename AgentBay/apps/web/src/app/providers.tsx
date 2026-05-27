'use client';
import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia, base } from 'viem/chains';
import { Toaster } from 'sonner';
import { QueryProvider } from '../lib/query.js';
import { AuthProvider } from '../lib/auth.js';

const PRIVY_APP_ID = process.env['NEXT_PUBLIC_PRIVY_APP_ID'] ?? '';
const CHAIN_ID = Number(process.env['NEXT_PUBLIC_CHAIN_ID'] ?? '84532');

export function Providers({ children }: { readonly children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#8b5cf6',
          logo: undefined,
        },
        defaultChain: CHAIN_ID === 8453 ? base : baseSepolia,
        supportedChains: [baseSepolia, base],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['wallet', 'email', 'google'],
      }}
    >
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#18181b',
                border: '1px solid #3f3f46',
                color: '#fafafa',
              },
            }}
          />
        </AuthProvider>
      </QueryProvider>
    </PrivyProvider>
  );
}
