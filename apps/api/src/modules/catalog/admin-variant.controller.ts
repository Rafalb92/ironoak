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
import { AdjustStockUseCase } from '../inventory/application/use-cases/adjust-stock/adjust-stock.use-case';
import {
  type AdjustStockInput as AdjustStockDto,
  adjustStockSchema,
  type UpdateVariantInput as UpdateVariantDto,
  updateVariantSchema,
} from '@ironoak/contracts';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/variants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminVariantController {
  constructor(
    private readonly admin: AdminCatalogService,
    private readonly adjustStock: AdjustStockUseCase,
  ) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update variant' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateVariantSchema)) dto: UpdateVariantDto,
  ) {
    return this.admin.updateVariant(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate variant' })
  @ApiResponse({
    status: 409,
    description: 'Cannot deactivate the last active variant',
  })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deactivateVariant(id);
  }

  @Patch(':id/stock')
  @ApiOperation({
    summary: 'Set stock level',
    description:
      'Sets absolute on-hand quantity. Cannot go below currently reserved.',
  })
  @ApiResponse({
    status: 409,
    description: 'New quantity is below reserved amount',
  })
  async setStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(adjustStockSchema)) dto: AdjustStockDto,
  ) {
    await this.adjustStock.execute(id, dto.quantityOnHand);
    return { success: true };
  }
}
