import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  findAll() {
    return this.catalog.findCategories();
  }
}
