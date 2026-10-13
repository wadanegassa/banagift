import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { badRequest } from '../lib/errors.js';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validates `req.body` / `req.query` / `req.params` against the provided
 * Zod schemas, replacing each with the parsed (and coerced/defaulted)
 * value. Throws a 400 VALIDATION_ERROR with field-level details on
 * failure.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = parse(schemas.body, req.body, 'body');
      }
      if (schemas.query) {
        req.query = parse(schemas.query, req.query, 'query') as typeof req.query;
      }
      if (schemas.params) {
        req.params = parse(schemas.params, req.params, 'params') as typeof req.params;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

function parse(schema: ZodSchema, value: unknown, location: string): unknown {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw badRequest('VALIDATION_ERROR', `Invalid ${location}`, result.error.flatten());
  }
  return result.data;
}
