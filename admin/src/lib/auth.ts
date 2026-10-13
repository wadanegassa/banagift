import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

const TOKEN_STORAGE_KEY = 'atelier-admin-token';
const EMAIL_STORAGE_KEY = 'atelier-admin-email';
export const MOCK_ADMIN_TOKEN = 'mock-admin-token';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const useMockAuth = (import.meta.env.VITE_USE_MOCK_AUTH as string | undefined) === 'true';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseClient;
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string, email?: string | null): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    if (email) localStorage.setItem(EMAIL_STORAGE_KEY, email);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function getStoredAdminEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EMAIL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Keep localStorage mirror in sync with the live Supabase session. */
export function syncSessionToStorage(session: Session | null): string | null {
  if (!session?.access_token) {
    clearAuthToken();
    return null;
  }
  setAuthToken(session.access_token, session.user?.email ?? getStoredAdminEmail());
  return session.access_token;
}

/**
 * Returns a fresh access token for API calls.
 * Prefers the live Supabase session (handles refresh) over a possibly stale localStorage copy.
 */
export async function getAccessTokenForRequest(): Promise<string | null> {
  if (useMockAuth) {
    return getAuthToken();
  }

  const client = getSupabaseClient();
  if (!client) return getAuthToken();

  const { data, error } = await client.auth.getSession();
  if (error) {
    return getAuthToken();
  }

  const token = syncSessionToStorage(data.session);
  return token ?? getAuthToken();
}

export interface LoginResult {
  token: string;
  email: string | null;
}

/** Signs in with Supabase email/password auth and stores the access token. */
export async function loginWithSupabase(email: string, password: string): Promise<LoginResult> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(error?.message ?? 'Sign in failed');
  }
  const token = syncSessionToStorage(data.session) ?? data.session.access_token;
  return { token, email: data.user?.email ?? email };
}

/** Dev-only mock login — stores the fixed mock admin token the backend recognizes. */
export function loginWithMockAuth(): LoginResult {
  setAuthToken(MOCK_ADMIN_TOKEN, 'dev@local.test');
  return { token: MOCK_ADMIN_TOKEN, email: 'dev@local.test' };
}

export async function logout(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut().catch(() => undefined);
  }
  clearAuthToken();
}
