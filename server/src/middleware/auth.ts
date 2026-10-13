import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { getMockAuthUser } from '../lib/mockDb.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { AuthenticatedAdmin } from '../types/express.js';

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Verifies the Bearer JWT against Supabase Auth (`supabase.auth.getUser`),
 * then requires the matching `profiles.role` to be `admin`.
 *
 * In mock mode (`USE_MOCK_DB=true`), `Bearer mock-admin-token` is treated as
 * an authenticated admin and `Bearer mock-customer-token` as an
 * authenticated non-admin, so auth behavior is testable without Supabase.
 */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw unauthorized('Missing or malformed Authorization header');
    }

    if (config.useMockDb) {
      const mockUser = getMockAuthUser(token);
      if (!mockUser) {
        throw unauthorized('Invalid or expired token');
      }
      if (mockUser.role !== 'admin') {
        throw forbidden('Administrator access required');
      }
      const admin: AuthenticatedAdmin = { id: mockUser.id, role: mockUser.role };
      req.admin = admin;
      next();
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw unauthorized('Invalid or expired token');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (profileError) {
      throw unauthorized('Unable to verify account');
    }
    if (!profile || profile.role !== 'admin') {
      throw forbidden('Administrator access required');
    }

    req.admin = { id: userData.user.id, role: profile.role };
    next();
  } catch (err) {
    next(err);
  }
}
