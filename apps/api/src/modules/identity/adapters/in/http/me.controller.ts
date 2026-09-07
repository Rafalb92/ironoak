import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../shared/decorators/current-user.decorator';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { CurrentUser as CurrentUserDto } from '@ironoak/contracts';

@ApiTags('auth')
@ApiCookieAuth('access_token')
@Controller('auth')
export class MeController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Current user identity' })
  @ApiResponse({
    status: 200,
    description: 'User id and role',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        role: { type: 'string', enum: ['USER', 'ADMIN'] },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  me(@CurrentUser() user: { userId: string }): CurrentUserDto {
    return user as CurrentUserDto;
  }
}
