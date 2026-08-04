import { Module } from '@nestjs/common';
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
    JwtAuthGuard,
  ],
  controllers: [PlaceOrderController],
})
export class OrderingModule {}
