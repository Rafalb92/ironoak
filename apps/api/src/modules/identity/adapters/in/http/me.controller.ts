import {
  Controller,
  Get,
  Inject,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { CurrentUser as CurrentUserDto } from '@ironoak/contracts';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../shared/decorators/current-user.decorator';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../application/ports/user.repository.port';

@ApiTags('auth')
@ApiCookieAuth('access_token')
@Controller('auth')
export class MeController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Current user',
    description:
      'Identity from the access token, enriched with the email from the database.',
  })
  @ApiResponse({ status: 200, description: 'User id, email and role' })
  @ApiResponse({
    status: 401,
    description:
      'Missing or invalid access token, or the user no longer exists',
  })
  async me(@CurrentUser() user: { userId: string }): Promise<CurrentUserDto> {
    const found = await this.users.findById(user.userId);
    // a valid token for a deleted account is still not a session
    if (!found) throw new UnauthorizedException();

    return { userId: found.id, email: found.email, role: found.role };
  }
}
