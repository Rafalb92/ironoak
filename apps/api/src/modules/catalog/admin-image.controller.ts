import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminCatalogService } from './admin-catalog.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { type UpdateImageInput, updateImageSchema } from '@ironoak/contracts';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminImageController {
  constructor(private readonly admin: AdminCatalogService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update image metadata or variant assignment' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateImageSchema)) dto: UpdateImageInput,
  ) {
    return this.admin.updateImage(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an image' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.removeImage(id);
  }
}
