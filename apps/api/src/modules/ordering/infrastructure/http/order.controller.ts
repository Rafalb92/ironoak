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

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly getMyOrders: GetMyOrdersUseCase,
    private readonly getOrderDetails: GetOrderDetailsUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.getMyOrders.execute(user.userId);
  }

  @Get(':id')
  details(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.getOrderDetails.execute(id, user.userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
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
