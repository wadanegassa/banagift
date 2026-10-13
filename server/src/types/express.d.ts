import type { UserRole } from './models.js';

export interface AuthenticatedAdmin {
  id: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
      /** Raw idempotency key supplied via the Idempotency-Key header. */
      idempotencyKey?: string;
    }
  }
}

export {};
