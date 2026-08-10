import { UserRole } from '../../../../application/ports/token-service.port';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: UserRole };
    }
  }
}
export {};
