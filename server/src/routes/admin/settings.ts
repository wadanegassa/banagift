import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { getAllSettings, updateSettings, WRITABLE_SETTING_KEYS } from '../../services/settings.js';
import type { ApiSuccess } from '../../types/api.js';
import type { BusinessSettingsMap } from '../../types/models.js';

export const adminSettingsRouter: Router = Router();

adminSettingsRouter.get('/settings', async (_req, res, next) => {
  try {
    const settings = await getAllSettings();
    const body: ApiSuccess<BusinessSettingsMap> = { data: settings };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// Partial update — any JSON object keyed by a known writable setting key.
// Unknown keys are silently ignored by the service layer.
const updateBodySchema = z.record(z.string(), z.unknown()).refine(
  (obj) => Object.keys(obj).some((key) => (WRITABLE_SETTING_KEYS as readonly string[]).includes(key)),
  { message: `Must include at least one of: ${WRITABLE_SETTING_KEYS.join(', ')}` },
);

adminSettingsRouter.patch('/settings', validate({ body: updateBodySchema }), async (req, res, next) => {
  try {
    const settings = await updateSettings(req.body as Record<string, unknown>, req.admin?.id ?? null);
    const body: ApiSuccess<BusinessSettingsMap> = { data: settings };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
