import { Module } from '@nestjs/common';
import { STOCK_ITEM_REPOSITORY } from './application/ports/stock-item.repository.port';
import { EntityManager } from '@mikro-orm/postgresql';
import { MikroOrmStockItemRepository } from './infrastructure/persistence/mikro-orm.stock-item.repository';
import { ReserveStockUseCase } from './application/use-cases/reserve-stock/reserve-stock.command';
import { ReleaseStockUseCase } from './application/use-cases/release-stock/release-stock.use-case';
import { ShipStockUseCase } from './application/use-cases/ship-stock/ship-stock.use-case';
import { InventoryOrderPlacedListener } from './application/listeners/order-placed.listener';
import { InventoryOrderCancelledListener } from './application/listeners/order-cancelled.listener';
import { InventoryOrderShippedListener } from './application/listeners/order-shipped.listener';
import { AdjustStockUseCase } from './application/use-cases/adjust-stock/adjust-stock.use-case';
import { CreateStockItemUseCase } from './application/use-cases/create-stock/create-stock.use-case';
import { InventoryVariantCreatedListener } from './application/listeners/variant-created.listener';

@Module({
  providers: [
    {
      provide: STOCK_ITEM_REPOSITORY,
      useFactory: (em: EntityManager) => new MikroOrmStockItemRepository(em),
      inject: [EntityManager],
    },
    ReserveStockUseCase,
    ReleaseStockUseCase,
    ShipStockUseCase,
    InventoryOrderPlacedListener,
    InventoryOrderCancelledListener,
    InventoryOrderShippedListener,
    AdjustStockUseCase,
    CreateStockItemUseCase,
    InventoryVariantCreatedListener,
  ],
  exports: [AdjustStockUseCase, CreateStockItemUseCase],
})
export class InventoryModule {}
