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
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('payments')
@ApiCookieAuth('access_token')
@Controller('orders')
export class InitiatePaymentController {
  constructor(private readonly initiatePayment: InitiatePaymentUseCase) {}

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Start payment for an order',
    description:
      'Creates a checkout session with the configured provider and returns a redirect URL. ' +
      'Calling twice returns the same URL rather than creating a second session.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        checkoutUrl: {
          type: 'string',
          example: 'https://checkout.stripe.com/c/pay/cs_test_...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Order is not awaiting payment' })
  @ApiResponse({ status: 404, description: 'Order not found or not yours' })
  async pay(
    @Param('id', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<{ checkoutUrl: string }> {
    return this.initiatePayment.execute(orderId, user.userId);
  }
}
