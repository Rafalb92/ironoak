import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CategorySchema } from './entities/category.entity';
import { ProductSchema } from './entities/product.entity';
import { ProductVariantSchema } from './entities/product-variant.entity';
import { ProductImageSchema } from './entities/product-image.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CategoryController } from './category.controller';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminVariantController } from './admin-variant.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      CategorySchema,
      ProductSchema,
      ProductVariantSchema,
      ProductImageSchema,
    ]),
    InventoryModule,
  ],
  controllers: [
    CatalogController,
    CategoryController,
    AdminCatalogController,
    AdminVariantController,
  ],
  providers: [CatalogService, AdminCatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
