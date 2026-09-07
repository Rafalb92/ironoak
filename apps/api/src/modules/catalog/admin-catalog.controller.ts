import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminCatalogService } from './admin-catalog.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import {
  type CreateProductInput as CreateProductDto,
  createProductSchema,
  type CreateVariantInput as CreateVariantDto,
  createVariantSchema,
  type UpdateProductInput as UpdateProductDto,
  updateProductSchema,
} from '@ironoak/contracts';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCatalogController {
  constructor(private readonly admin: AdminCatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List all products, including inactive' })
  list(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.admin.listProducts(Number(page), Number(limit));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a product with at least one variant',
    description:
      'Variants trigger stock item creation in Inventory via a domain event.',
  })
  @ApiResponse({ status: 409, description: 'Slug or SKU already in use' })
  create(
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductDto,
  ) {
    return this.admin.createProduct(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product metadata' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductDto,
  ) {
    return this.admin.updateProduct(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a product',
    description:
      'Soft delete — the record stays so order history remains readable.',
  })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deactivateProduct(id);
  }

  @Post(':id/variants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a variant to an existing product' })
  addVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createVariantSchema)) dto: CreateVariantDto,
  ) {
    return this.admin.addVariant(id, dto);
  }
}
