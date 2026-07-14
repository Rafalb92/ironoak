import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CategorySchema } from './entities/category.entity';
import { ProductSchema } from './entities/product.entity';
import { ProductVariantSchema } from './entities/product-variant.entity';
import { ProductImageSchema } from './entities/product-image.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      CategorySchema,
      ProductSchema,
      ProductVariantSchema,
      ProductImageSchema,
    ]),
  ],
})
export class CatalogModule {}
