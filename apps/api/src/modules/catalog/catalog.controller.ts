import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  productQuerySchema,
  type ProductQuery,
} from './dto/product-query.schema';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('catalog')
@Controller('products')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(productQuerySchema))
  @ApiOperation({
    summary: 'List products',
    description:
      'Returns a paginated list of products. Filters operate on variant attributes — ' +
      'a product matches if at least one of its variants matches all given filters.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Category slug',
    example: 'barbells',
  })
  @ApiQuery({ name: 'material', required: false, example: 'Cast Iron' })
  @ApiQuery({
    name: 'minWeight',
    required: false,
    description: 'Minimum weight in grams',
    example: 15000,
  })
  @ApiQuery({
    name: 'maxWeight',
    required: false,
    description: 'Maximum weight in grams',
    example: 25000,
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price in cents',
    example: 10000,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['name', 'price_asc', 'price_desc', 'newest'],
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 12 })
  @ApiResponse({
    status: 200,
    description: 'Paginated product list with variants and images',
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  findAll(@Query() query: ProductQuery) {
    return this.catalog.findProducts(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product details' })
  @ApiParam({ name: 'slug', example: 'heirloom-barbell' })
  @ApiResponse({
    status: 200,
    description: 'Product with all active variants and images',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('slug') slug: string) {
    return this.catalog.findBySlug(slug);
  }
}
