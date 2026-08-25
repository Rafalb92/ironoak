import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { GetMyOrdersUseCase } from '../../application/use-cases/get-my-orders/get-my-orders.use-case';
import { GetOrderDetailsUseCase } from '../../application/use-cases/get-order-details/get-order-details.use-case';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order/cancel-order.use-case';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('orders')
@ApiCookieAuth('access_token')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly getMyOrders: GetMyOrdersUseCase,
    private readonly getOrderDetails: GetOrderDetailsUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List my orders',
    description: 'Newest first. Scoped to the authenticated customer.',
  })
  @ApiResponse({ status: 200, description: 'Order summaries' })
  list(@CurrentUser() user: { userId: string }) {
    return this.getMyOrders.execute(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Order details' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Full order with lines and delivery address',
  })
  @ApiResponse({
    status: 404,
    description:
      'Not found — returned also when the order belongs to another customer, so existence is not disclosed',
  })
  details(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.getOrderDetails.execute(id, user.userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel my order',
    description: 'Allowed only from PENDING_PAYMENT or PAID.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'Changed my mind' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found or not yours' })
  @ApiResponse({
    status: 409,
    description: 'Order is not in a cancellable state',
  })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
    @Body('reason') reason?: string,
  ): Promise<{ success: true }> {
    await this.cancelOrder.execute(
      id,
      user.userId,
      reason ?? 'Cancelled by customer',
    );
    return { success: true };
  }
}
