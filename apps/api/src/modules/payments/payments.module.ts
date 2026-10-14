import { Module } from '@nestjs/common';
import { PaymentSimulationController } from './adapters/in/http/payment-simulation.controller';
import { EntityManager } from '@mikro-orm/postgresql';
import { OrderingModule } from '../ordering/ordering.module';
import { PAYMENT_REPOSITORY } from './application/ports/payment.repository.port';
import { PAYMENT_PROVIDER } from './application/ports/payment-provider.port';
import { ORDER_LOOKUP } from './application/ports/order-lookup.port';
import { MikroOrmPaymentRepository } from './adapters/out/persistence/mikro-orm-payment.repository';
import { FakePaymentProvider } from './adapters/out/payment/fake-payment.provider';
import { OrderRepositoryOrderLookup } from './adapters/out/order/order-repository.order-lookup';
import { PaymentWebhookController } from './adapters/in/http/payment-webhook.controller';
import { InitiatePaymentController } from './adapters/in/http/initiate-payment.controller';
import { InitiatePaymentUseCase } from './application/use-cases/initiate-payment/initiate-payment.use-case';
import { HandlePaymentWebhookUseCase } from './application/use-cases/handle-payment-webhook/handle-payment-webhook.use-case';
import { StripePaymentProvider } from './adapters/out/payment/stripe-payment.provider';
import { PaymentSimulationEnabledGuard } from './adapters/in/http/payment-simulation-enabled.guard';

@Module({
  imports: [OrderingModule], // ← OrderQueryService, do OrderLookup
  providers: [
    {
      provide: PAYMENT_REPOSITORY,
      useFactory: (em: EntityManager) => new MikroOrmPaymentRepository(em),
      inject: [EntityManager],
    },
    {
      provide: PAYMENT_PROVIDER,
      useClass:
        process.env.PAYMENT_PROVIDER === 'stripe'
          ? StripePaymentProvider
          : FakePaymentProvider,
    },
    {
      provide: ORDER_LOOKUP,
      useClass: OrderRepositoryOrderLookup,
    },
    InitiatePaymentUseCase,
    HandlePaymentWebhookUseCase,
    PaymentSimulationEnabledGuard,
  ],
  controllers: [
    InitiatePaymentController,
    PaymentWebhookController,
    PaymentSimulationController,
  ],
})
export class PaymentsModule {}
