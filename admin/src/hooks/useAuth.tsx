import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  clearAuthToken,
  getAuthToken,
  getStoredAdminEmail,
  getSupabaseClient,
  isSupabaseConfigured,
  loginWithMockAuth,
  loginWithSupabase,
  logout as performLogout,
  syncSessionToStorage,
  useMockAuth,
} from '@/lib/auth';

export interface AuthContextValue {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mockAuthAvailable: boolean;
  supabaseConfigured: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  loginAsMockAdmin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const client = getSupabaseClient();
      if (client && !useMockAuth) {
        const { data } = await client.auth.getSession();
        if (cancelled) return;
        const nextToken = syncSessionToStorage(data.session);
        setToken(nextToken);
        setEmail(data.session?.user?.email ?? (nextToken ? getStoredAdminEmail() : null));
      } else {
        setToken(getAuthToken());
        setEmail(getStoredAdminEmail());
      }
      if (!cancelled) setIsLoading(false);
    }

    void hydrate();

    const client = getSupabaseClient();
    if (!client) return;

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      const nextToken = syncSessionToStorage(session);
      setToken(nextToken);
      setEmail(session?.user?.email ?? (nextToken ? getStoredAdminEmail() : null));
    });

    function onUnauthorized() {
      setToken(null);
      setEmail(null);
    }
    window.addEventListener('atelier:admin-unauthorized', onUnauthorized);

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
      window.removeEventListener('atelier:admin-unauthorized', onUnauthorized);
    };
  }, []);

  const loginWithPassword = useCallback(async (emailValue: string, password: string) => {
    const result = await loginWithSupabase(emailValue, password);
    setToken(result.token);
    setEmail(result.email);
  }, []);

  const loginAsMockAdmin = useCallback(() => {
    const result = loginWithMockAuth();
    setToken(result.token);
    setEmail(result.email);
  }, []);

  const logout = useCallback(async () => {
    await performLogout();
    clearAuthToken();
    setToken(null);
    setEmail(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      email,
      isAuthenticated: Boolean(token),
      isLoading,
      mockAuthAvailable: useMockAuth,
      supabaseConfigured: isSupabaseConfigured,
      loginWithPassword,
      loginAsMockAdmin,
      logout,
    }),
    [token, email, isLoading, loginWithPassword, loginAsMockAdmin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
