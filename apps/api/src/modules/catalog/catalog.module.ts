import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CategorySchema } from './entities/category.entity';
import { ProductSchema } from './entities/product.entity';
import { ProductVariantSchema } from './entities/product-variant.entity';
import { ProductImageSchema } from './entities/product-image.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CategoryController } from './category.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      CategorySchema,
      ProductSchema,
      ProductVariantSchema,
      ProductImageSchema,
    ]),
  ],
  controllers: [CatalogController, CategoryController],
  providers: [CatalogService],
})
export class CatalogModule {}
