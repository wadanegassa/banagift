import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './lib/logger.js';

const app = createApp();

app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port} (mode=${config.useMockDb ? 'mock' : 'supabase'})`);
});
