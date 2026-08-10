import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../modules/identity/application/ports/token-service.port';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
