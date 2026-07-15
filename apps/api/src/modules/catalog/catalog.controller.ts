import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  productQuerySchema,
  type ProductQuery,
} from './dto/product-query.schema';
import { ZodValidationPipe } from '../identity/adapters/in/http/pipes/zod-validation.pipe';

@Controller('products')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(productQuerySchema))
  findAll(@Query() query: ProductQuery) {
    return this.catalog.findProducts(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.catalog.findBySlug(slug);
  }
}
