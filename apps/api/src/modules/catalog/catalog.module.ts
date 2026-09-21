import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CategoryController } from './category.controller';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminVariantController } from './admin-variant.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryStockLookup } from './infrastructure/stock/inventory-stock-lookup';
import { STOCK_LOOKUP } from './application/ports/stock-lookup.port';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { AdminImageController } from './admin-image.controller';

@Module({
  imports: [InventoryModule],
  controllers: [
    CatalogController,
    CategoryController,
    AdminCatalogController,
    AdminVariantController,
    AdminImageController,
  ],
  providers: [
    CatalogService,
    AdminCatalogService,
    {
      provide: STOCK_LOOKUP,
      useClass: InventoryStockLookup,
    },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [CatalogService, STOCK_LOOKUP],
})
export class CatalogModule {}
