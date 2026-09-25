import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApiExcludeController } from '@nestjs/swagger';
import { HandlePaymentWebhookUseCase } from '../../application/use-cases/handle-payment-webhook/handle-payment-webhook.use-case';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation.pipe';
import { PaymentSimulationEnabledGuard } from './payment-simulation-enabled.guard';
import {
  simulatePaymentSchema,
  type SimulatePaymentInput,
  type SimulatePaymentResult,
} from '@ironoak/contracts';

// development tool: stands in for the provider's webhook
@ApiExcludeController()
@UseGuards(PaymentSimulationEnabledGuard)
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
      orderId: '', // the use case looks the payment up by sessionId
      sessionId,
      reason: outcome === 'failure' ? 'Simulated failure' : undefined,
    });
    return { simulated: outcome };
  }
}
