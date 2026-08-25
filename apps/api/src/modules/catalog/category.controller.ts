import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('catalog')
@Controller('categories')
export class CategoryController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List categories' })
  @ApiResponse({
    status: 200,
    description: 'List of all categories with their slugs and names',
  })
  findAll() {
    return this.catalog.findCategories();
  }
}
