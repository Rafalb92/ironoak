import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation.pipe';

import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOrderQueryService } from '../../application/services/admin-order-query.service';
import {
  type AdminOrderQuery,
  adminOrderQuerySchema,
} from '@ironoak/contracts';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrderQueryController {
  constructor(private readonly orders: AdminOrderQueryService) {}

  @Get()
  @ApiOperation({
    summary: 'List all orders',
    description:
      'Search accepts either an order id fragment or a customer email fragment — ' +
      'the shape of the term decides which.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'PENDING_PAYMENT',
      'PAID',
      'FULFILLING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ],
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  list(
    @Query(new ZodValidationPipe(adminOrderQuerySchema)) query: AdminOrderQuery,
  ) {
    return this.orders.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Order detail for admin' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.detail(id);
  }
}
