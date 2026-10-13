import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalRateLimiter } from './middleware/rateLimit.js';
import { httpLogger } from './lib/logger.js';
import { adminRouter } from './routes/admin/index.js';
import { publicRouter } from './routes/public/index.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // API is consumed cross-origin by the storefront/admin; relax CORP so browsers can read responses.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(httpLogger);
  app.use('/api', generalRateLimiter);

  app.use('/api', publicRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
