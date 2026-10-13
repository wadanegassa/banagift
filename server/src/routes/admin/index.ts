import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { adminCategoriesRouter } from './categories.js';
import { adminDashboardRouter } from './dashboard.js';
import { adminOrdersRouter } from './orders.js';
import { adminProductsRouter } from './products.js';
import { adminSettingsRouter } from './settings.js';

export const adminRouter: Router = Router();

// Every admin route requires a verified Supabase JWT belonging to a
// profiles.role === 'admin' account.
adminRouter.use(requireAdmin);

adminRouter.use(adminDashboardRouter);
adminRouter.use(adminOrdersRouter);
adminRouter.use(adminProductsRouter);
adminRouter.use(adminCategoriesRouter);
adminRouter.use(adminSettingsRouter);
