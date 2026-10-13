import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import { config } from '../config.js';

// Node 18 has no global WebSocket; supabase-js realtime expects one at construct time.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket: typeof WebSocket }).WebSocket = WebSocket as unknown as typeof WebSocket;
}

let adminClient: SupabaseClient | null = null;

/**
 * Service-role Supabase client. Bypasses RLS — only ever used server-side,
 * never exposed to clients. Lazily constructed so that mock-mode test runs
 * never require real Supabase credentials.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (config.useMockDb) {
    throw new Error('getSupabaseAdmin() called while USE_MOCK_DB=true');
  }
  if (!adminClient) {
    adminClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}
