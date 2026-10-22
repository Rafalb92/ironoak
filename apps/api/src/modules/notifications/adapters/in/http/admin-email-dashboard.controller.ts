import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AdminEmailStats } from '@ironoak/contracts';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../../shared/guards/roles.guard';
import { Roles } from '../../../../../shared/decorators/roles.decorator';
import { EmailStatsService } from '../../../application/services/email-stats.service';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminEmailDashboardController {
  constructor(private readonly stats: EmailStatsService) {}

  @Get('emails')
  @ApiOperation({ summary: 'Emails sent in the last 7 days, by status' })
  emails(): Promise<AdminEmailStats> {
    return this.stats.lastWeek();
  }
}
