import { UserRole } from '../../../../../../shared-infra/auth/token-service.port';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: UserRole };
    }
  }
}
export {};
