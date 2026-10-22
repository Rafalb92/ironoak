import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AdminLowStockItem } from '@ironoak/contracts';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CatalogAdminDashboardService } from './admin-dashboard.service';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CatalogAdminDashboardController {
  constructor(private readonly dashboard: CatalogAdminDashboardService) {}

  @Get('low-stock')
  @ApiOperation({
    summary: 'Variants running low',
    description:
      'Active variants at or below the low-stock threshold, lowest first, out of stock included.',
  })
  lowStock(): Promise<AdminLowStockItem[]> {
    return this.dashboard.lowStock();
  }
}
