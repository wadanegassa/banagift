import { Router } from 'express';
import { getDashboardSummary, type DashboardSummary } from '../../services/dashboard.js';
import type { ApiSuccess } from '../../types/api.js';

export const adminDashboardRouter: Router = Router();

adminDashboardRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const summary = await getDashboardSummary();
    const body: ApiSuccess<DashboardSummary> = { data: summary };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
