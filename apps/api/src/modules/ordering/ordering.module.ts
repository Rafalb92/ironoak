import { Module } from '@nestjs/common';
import { CancelOrderUseCase } from './application/use-cases/cancel-order/cancel-order.use-case';
import { EntityManager } from '@mikro-orm/postgresql';
import { CatalogModule } from '../catalog/catalog.module';
import { CatalogService } from '../catalog/catalog.service';
import { IdentityModule } from '../identity/identity.module';
import { ORDER_REPOSITORY } from './application/ports/order.repository.port';
import { CATALOG_GATEWAY } from './application/ports/catalog-gateway.port';
import { MikroOrmOrderRepository } from './infrastructure/persistence/mikro-orm-order.repository';
import { CatalogServiceGateway } from './infrastructure/catalog/catalog-service.gateway';
import { PlaceOrderUseCase } from './application/use-cases/place-order/place-order.use-case';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PlaceOrderController } from './infrastructure/http/place-order.controller';
import { OrderController } from './infrastructure/http/order.controller';
import { GetMyOrdersUseCase } from './application/use-cases/get-my-orders/get-my-orders.use-case';
import { GetOrderDetailsUseCase } from './application/use-cases/get-order-details/get-order-details.use-case';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { OrderAdminController } from './infrastructure/http/order-admin.controller';
import { ShipOrderUseCase } from './application/use-cases/ship-order/ship-order.use-case';
import { MarkDeliveredUseCase } from './application/use-cases/mark-delivered/mark-delivered.use-case';
import { StartFulfillmentUseCase } from './application/use-cases/start-fulfillment/start-fulfillment.use-case';
import { ConfirmPaymentUseCase } from './application/use-cases/confirm-payment/confirm-payment.use-case';
import { OrderPlacedListener } from './application/event-handlers/order-placed.listener';

@Module({
  imports: [CatalogModule, IdentityModule], // ← jawna zależność między kontekstami
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useFactory: (em: EntityManager) => new MikroOrmOrderRepository(em),
      inject: [EntityManager],
    },
    {
      provide: CATALOG_GATEWAY,
      useFactory: (catalog: CatalogService) =>
        new CatalogServiceGateway(catalog),
      inject: [CatalogService],
    },
    PlaceOrderUseCase,
    GetMyOrdersUseCase,
    GetOrderDetailsUseCase,
    CancelOrderUseCase,
    ShipOrderUseCase,
    MarkDeliveredUseCase,
    StartFulfillmentUseCase,
    ConfirmPaymentUseCase,
    JwtAuthGuard,
    RolesGuard,
    OrderPlacedListener,
  ],
  controllers: [PlaceOrderController, OrderController, OrderAdminController],
  exports: [PlaceOrderUseCase], // ← for cart module to use in checkout
})
export class OrderingModule {}
