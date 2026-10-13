import { Router } from 'express';
import { categoriesRouter } from './categories.js';
import { healthRouter } from './health.js';
import { ordersRouter } from './orders.js';
import { productsRouter } from './products.js';
import { settingsRouter } from './settings.js';

export const publicRouter: Router = Router();

publicRouter.use(healthRouter);
publicRouter.use(productsRouter);
publicRouter.use(categoriesRouter);
publicRouter.use(settingsRouter);
publicRouter.use(ordersRouter);
