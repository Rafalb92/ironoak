import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../../../../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../../shared/guards/roles.guard';
import { CurrentUser } from '../../../../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { CustomerQueryService } from '../../../application/services/customer-query.service';
import {
  type AdminUserQuery,
  type ChangeRoleInput,
  changeRoleSchema,
  adminUserQuerySchema,
} from '@ironoak/contracts';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUserController {
  constructor(private readonly users: CustomerQueryService) {}

  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Search by email fragment.',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  list(
    @Query(new ZodValidationPipe(adminUserQuerySchema)) query: AdminUserQuery,
  ) {
    return this.users.list(query);
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user role',
    description:
      'Revokes all sessions for that user so the new role takes effect on next login.',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot change own role or demote the last admin',
  })
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(changeRoleSchema)) dto: ChangeRoleInput,
    @CurrentUser() actor: { userId: string },
  ) {
    await this.users.changeRole({
      targetUserId: id,
      newRole: dto.role,
      actingAdminId: actor.userId,
    });
    return { success: true };
  }
}
