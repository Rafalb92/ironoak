import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LogoutUseCase } from '../../../application/use-cases/logout/logout.use-case';

@Controller('auth')
export class LogoutController {
  constructor(private readonly logout: LogoutUseCase) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logoutUser(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    await this.logout.execute(req.cookies?.['refresh_token']);

    // Wyczyść oba ciasteczka — path MUSI się zgadzać z tym przy ustawianiu
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth' });

    return { success: true };
  }
}
