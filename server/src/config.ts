import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Always load server/.env even if the process was started from the monorepo root.
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env'),
});


const boolFromString = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1')
  .default('false');

const intFromString = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : Number.parseInt(v, 10)))
    .pipe(z.number().int().positive());

const envSchema = z.object({
  PORT: intFromString(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Comma-separated list, e.g. http://localhost:5173,http://localhost:5175
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5175'),

  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),

  USE_MOCK_DB: boolFromString,

  RATE_LIMIT_WINDOW_MS: intFromString(900_000),
  RATE_LIMIT_MAX: intFromString(100),
  ORDER_RATE_LIMIT_MAX: intFromString(10),
  TRACK_RATE_LIMIT_MAX: intFromString(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const env = parsed.data;

if (!env.USE_MOCK_DB) {
  const missing: string[] = [];
  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!env.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables when USE_MOCK_DB=false: ${missing.join(', ')}`,
    );
  }
}

const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  corsOrigin: corsOrigins.length === 1 ? corsOrigins[0]! : corsOrigins,

  supabaseUrl: env.SUPABASE_URL,
  supabaseAnonKey: env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,

  useMockDb: env.USE_MOCK_DB,

  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: env.RATE_LIMIT_MAX,
  orderRateLimitMax: env.ORDER_RATE_LIMIT_MAX,
  trackRateLimitMax: env.TRACK_RATE_LIMIT_MAX,
} as const;

export type Config = typeof config;
