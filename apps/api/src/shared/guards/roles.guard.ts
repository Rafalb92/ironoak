import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ALLOW_DEMO_KEY } from '../decorators/allow-demo.decorator';
import type { UserRole } from '../../shared-infra/auth/token-service.port';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      targets,
    );

    // no @Roles() = no role requirement
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (requiredRoles.includes(user.role)) {
      return true;
    }

    /**
     * The public demo admin sees everything an admin sees, but may only change
     * what is explicitly marked @AllowDemo() — deny by default, so a visitor
     * can walk an order through fulfillment but cannot wreck the catalogue.
     */
    if (user.role === 'DEMO_ADMIN' && requiredRoles.includes('ADMIN')) {
      const allowedWrite = this.reflector.getAllAndOverride<boolean>(
        ALLOW_DEMO_KEY,
        targets,
      );
      if (SAFE_METHODS.has(request.method) || allowedWrite) {
        return true;
      }
      throw new ForbiddenException(
        'Disabled in the demo: this account can view everything and move orders through fulfillment.',
      );
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
