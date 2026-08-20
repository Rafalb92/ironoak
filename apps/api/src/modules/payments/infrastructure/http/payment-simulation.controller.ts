import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  Body,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { HandlePaymentWebhookUseCase } from '../../application/use-cases/handle-payment-webhook/handle-payment-webhook.use-case';

@Controller('payments/simulate')
export class PaymentSimulationController {
  constructor(private readonly handleWebhook: HandlePaymentWebhookUseCase) {}

  @Post(':sessionId')
  @HttpCode(HttpStatus.OK)
  async simulate(
    @Param('sessionId') sessionId: string,
    @Body('outcome') outcome: 'success' | 'failure' = 'success',
  ): Promise<{ simulated: string }> {
    await this.handleWebhook.execute({
      eventId: randomUUID(),
      type: outcome === 'success' ? 'payment.succeeded' : 'payment.failed',
      orderId: '', // use case i tak szuka po sessionId
      sessionId,
      reason: outcome === 'failure' ? 'Simulated failure' : undefined,
    });
    return { simulated: outcome };
  }
}
