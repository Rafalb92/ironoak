import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token.use-case';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthSuccess } from '@ironoak/contracts';

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class RefreshTokenController {
  constructor(private readonly refreshToken: RefreshTokenUseCase) {}

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate tokens',
    description:
      'Consumes the refresh_token cookie and issues a new pair. The old token is ' +
      'invalidated. Presenting an already-rotated token is treated as theft and ' +
      'terminates every session for that user.',
  })
  @ApiResponse({ status: 200, description: 'New token pair set as cookies' })
  @ApiResponse({
    status: 401,
    description: 'Missing, expired, or already-used refresh token',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSuccess> {
    const token = req.cookies?.['refresh_token'];
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { accessToken, refreshToken } =
      await this.refreshToken.execute(token);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: ACCESS_TTL_MS,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: REFRESH_TTL_MS,
      path: '/auth',
    });

    return { success: true };
  }
}
