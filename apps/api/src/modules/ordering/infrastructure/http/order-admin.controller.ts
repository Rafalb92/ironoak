import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { StartFulfillmentUseCase } from '../../application/use-cases/start-fulfillment/start-fulfillment.use-case';
import { ShipOrderUseCase } from '../../application/use-cases/ship-order/ship-order.use-case';
import { MarkDeliveredUseCase } from '../../application/use-cases/mark-delivered/mark-delivered.use-case';

// UWAGA: brak endpointu confirm-payment — był tymczasową atrapą webhooka.
// Płatność potwierdza teraz system automatycznie (PaymentSucceededListener →
// ConfirmPaymentBySystemUseCase), w reakcji na zdarzenie payment.succeeded.
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard) // kolejność: auth PRZED rolami
@Roles('ADMIN')
export class OrderAdminController {
  constructor(
    private readonly startFulfillment: StartFulfillmentUseCase,
    private readonly shipOrder: ShipOrderUseCase,
    private readonly markDelivered: MarkDeliveredUseCase,
  ) {}

  @Post(':id/fulfill')
  @HttpCode(HttpStatus.OK)
  async fulfill(@Param('id', ParseUUIDPipe) id: string) {
    await this.startFulfillment.execute(id);
    return { success: true };
  }

  @Post(':id/ship')
  @HttpCode(HttpStatus.OK)
  async ship(@Param('id', ParseUUIDPipe) id: string) {
    await this.shipOrder.execute(id);
    return { success: true };
  }

  @Post(':id/deliver')
  @HttpCode(HttpStatus.OK)
  async deliver(@Param('id', ParseUUIDPipe) id: string) {
    await this.markDelivered.execute(id);
    return { success: true };
  }
}
