'use client';
// Privy + SIWE authentication. Provides useAuth() hook for the entire app.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { SiweMessage } from 'siwe';
import { auth as authApi } from './api.js';
import type { User } from './types.js';

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  isAuthenticated: boolean;
  walletAddress: string | undefined;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const { ready, authenticated, login: privyLogin, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();
  const [user, setUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const wallet = wallets[0];
  const walletAddress = wallet?.address;

  // Check existing session on mount
  useEffect(() => {
    authApi
      .me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setSessionChecked(true));
  }, []);

  // When Privy reports authenticated but we have no API session, do SIWE handshake
  useEffect(() => {
    if (!ready || !authenticated || !wallet || user) return;

    async function doSiwe() {
      try {
        const { nonce } = await authApi.nonce();
        const chain = await wallet!.getEthereumProvider();
        const chainIdHex = (await chain.request({ method: 'eth_chainId' })) as string;
        const chainId = parseInt(chainIdHex, 16);

        const message = new SiweMessage({
          domain: window.location.host,
          address: wallet!.address,
          statement: 'Sign in to AgentBay',
          uri: window.location.origin,
          version: '1',
          chainId,
          nonce,
        });
        const prepared = message.prepareMessage();

        const signature = (await chain.request({
          method: 'personal_sign',
          params: [prepared, wallet!.address],
        })) as string;

        const { user: u } = await authApi.verify(prepared, signature);
        setUser(u);
      } catch {
        // SIWE failed — user stays logged out of our API even if Privy reports authenticated
      }
    }

    void doSiwe();
  }, [ready, authenticated, wallet, user]);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    await privyLogout();
    setUser(null);
  }, [privyLogout]);

  const isReady = ready && sessionChecked;

  return (
    <AuthContext.Provider
      value={{
        user,
        isReady,
        isAuthenticated: user !== null,
        walletAddress,
        login: privyLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
