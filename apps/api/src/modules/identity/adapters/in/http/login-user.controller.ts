import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UsePipes,
} from '@nestjs/common';
import type { Response } from 'express';

import { ZodValidationPipe } from './pipes/zod-validation.pipe';
import { LoginUserUseCase } from 'src/modules/identity/application/use-cases/login-user/login-user.use-case';
import { LoginUserCommand } from 'src/modules/identity/application/use-cases/login-user/login-user.command';
import { type LoginUserDto, loginUserSchema } from './dto/login-user.dto';

const ACCESS_TTL_MS = 15 * 60 * 1000; // 15 min
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dni

@Controller('auth')
export class LoginUserController {
  constructor(private readonly loginUser: LoginUserUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginUserSchema))
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const { accessToken, refreshToken } = await this.loginUser.execute(
      new LoginUserCommand(dto.email, dto.password),
    );

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
      path: '/auth', // refresh potrzebny tylko na endpointach /auth
    });

    return { success: true };
  }
}
