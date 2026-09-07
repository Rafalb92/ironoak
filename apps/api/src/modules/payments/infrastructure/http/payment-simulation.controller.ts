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
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation.pipe';
import {
  simulatePaymentSchema,
  type SimulatePaymentInput,
  type SimulatePaymentResult,
} from '@ironoak/contracts';

@Controller('payments/simulate')
export class PaymentSimulationController {
  constructor(private readonly handleWebhook: HandlePaymentWebhookUseCase) {}

  @Post(':sessionId')
  @HttpCode(HttpStatus.OK)
  async simulate(
    @Param('sessionId') sessionId: string,
    @Body(new ZodValidationPipe(simulatePaymentSchema))
    { outcome }: SimulatePaymentInput,
  ): Promise<SimulatePaymentResult> {
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
