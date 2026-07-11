import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../../../application/ports/token-service.port';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request.cookies?.['access_token'];
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = await this.tokens.verifyAccessToken(token);
      request.user = { userId: payload.userId };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
