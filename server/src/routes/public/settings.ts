import { Router } from 'express';
import { getPublicSettings } from '../../services/settings.js';
import type { ApiSuccess } from '../../types/api.js';
import type { BusinessSettingsMap } from '../../types/models.js';

export const settingsRouter: Router = Router();

settingsRouter.get('/settings/public', async (_req, res, next) => {
  try {
    const settings = await getPublicSettings();
    const body: ApiSuccess<BusinessSettingsMap> = { data: settings };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
