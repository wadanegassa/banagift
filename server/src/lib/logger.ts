import pino from 'pino';
import { pinoHttp as createPinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { config } from '../config.js';

// Structured logging. We never log request/response bodies, so most PII
// (phones, addresses, notes, etc.) never reaches the logger in the first
// place. The redact list below is a defense-in-depth measure for any
// object that is logged directly (e.g. `logger.info({ order }, ...)`).
const PII_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  '*.customer_phone',
  '*.recipient_phone',
  '*.phone',
  '*.delivery_address',
  '*.address',
  '*.delivery_instructions',
  '*.gift_message',
  '*.special_request',
  '*.supplier_contact',
  '*.supplier_notes',
  '*.delivery_person_name',
  '*.delivery_person_phone',
  '*.delivery_arrangement_notes',
  '*.payment_notes',
  '*.note_text',
  '*.tracking_token',
  '*.trackingToken',
];

export const logger = pino({
  level: config.isTest ? 'silent' : config.isProduction ? 'info' : 'debug',
  redact: {
    paths: PII_PATHS,
    censor: '[redacted]',
  },
});

export const httpLogger = createPinoHttp({
  logger,
  autoLogging: !config.isTest,
  redact: PII_PATHS,
  // Only log route shape metadata — never bodies/query params that may
  // carry customer PII.
  serializers: {
    req(req: IncomingMessage & { method?: string; url?: string }) {
      return {
        method: req.method,
        url: req.url,
      };
    },
    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
