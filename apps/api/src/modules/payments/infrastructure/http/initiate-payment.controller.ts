import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InitiatePaymentUseCase } from '../../application/use-cases/initiate-payment/initiate-payment.use-case';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';

@Controller('orders')
export class InitiatePaymentController {
  constructor(private readonly initiatePayment: InitiatePaymentUseCase) {}

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async pay(
    @Param('id', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<{ checkoutUrl: string }> {
    return this.initiatePayment.execute(orderId, user.userId);
  }
}
