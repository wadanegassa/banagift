import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
    setupFiles: ['./src/__tests__/setupEnv.ts'],
    env: {
      NODE_ENV: 'test',
      USE_MOCK_DB: 'true',
      CORS_ORIGIN: 'http://localhost:5173',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX: '100',
      ORDER_RATE_LIMIT_MAX: '10',
      TRACK_RATE_LIMIT_MAX: '30',
    },
  },
});
