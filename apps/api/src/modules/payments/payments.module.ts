import { Module } from '@nestjs/common';
import { PaymentSimulationController } from './infrastructure/http/payment-simulation.controller';
import { EntityManager } from '@mikro-orm/postgresql';
import { OrderingModule } from '../ordering/ordering.module';
import { PAYMENT_REPOSITORY } from './application/ports/payment.repository.port';
import { PAYMENT_PROVIDER } from './application/ports/payment-provider.port';
import { ORDER_LOOKUP } from './application/ports/order-lookup.port';
import { MikroOrmPaymentRepository } from './infrastructure/persistence/mikro-orm-payment.repository';
import { FakePaymentProvider } from './infrastructure/providers/fake-payment.provider';
import { OrderRepositoryOrderLookup } from './infrastructure/order-lookup/order-repository.order-lookup';
import { PaymentWebhookController } from './infrastructure/http/payment-webhook.controller';
import { InitiatePaymentController } from './infrastructure/http/initiate-payment.controller';
import { InitiatePaymentUseCase } from './application/use-cases/initiate-payment/initiate-payment.use-case';
import { HandlePaymentWebhookUseCase } from './application/use-cases/handle-payment-webhook/handle-payment-webhook.use-case';

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
      useClass: FakePaymentProvider,
    },
    {
      provide: ORDER_LOOKUP,
      useClass: OrderRepositoryOrderLookup,
    },
    InitiatePaymentUseCase,
    HandlePaymentWebhookUseCase,
  ],
  controllers: [
    InitiatePaymentController,
    PaymentWebhookController,
    PaymentSimulationController,
  ],
})
export class PaymentsModule {}
