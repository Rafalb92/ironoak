import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AdminDashboardOrders } from '@ironoak/contracts';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../../shared/guards/roles.guard';
import { Roles } from '../../../../../shared/decorators/roles.decorator';
import { AdminOrderDashboardService } from '../../../application/services/admin-order-dashboard.service';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrderDashboardController {
  constructor(private readonly dashboard: AdminOrderDashboardService) {}

  @Get('orders')
  @ApiOperation({
    summary: 'Order figures for the dashboard',
    description:
      'Paid revenue and orders over 30 days, counts by status, and daily revenue for 14 days.',
  })
  orders(): Promise<AdminDashboardOrders> {
    return this.dashboard.summary();
  }
}
