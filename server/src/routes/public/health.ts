import { Router } from 'express';
import { config } from '../../config.js';
import type { ApiSuccess } from '../../types/api.js';

export const healthRouter: Router = Router();

healthRouter.get('/health', (_req, res) => {
  const body: ApiSuccess<{ status: 'ok'; mode: 'mock' | 'supabase'; timestamp: string }> = {
    data: {
      status: 'ok',
      mode: config.useMockDb ? 'mock' : 'supabase',
      timestamp: new Date().toISOString(),
    },
  };
  res.json(body);
});
