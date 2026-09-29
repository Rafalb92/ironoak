import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminCatalogService } from './admin-catalog.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import {
  type CreateImageUploadInput,
  createImageUploadSchema,
  type UpdateImageInput,
  updateImageSchema,
} from '@ironoak/contracts';
import { ProductMediaService } from './product-media.service';

@ApiTags('admin')
@ApiCookieAuth('access_token')
@Controller('admin/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminImageController {
  constructor(
    private readonly admin: AdminCatalogService,
    private readonly media: ProductMediaService,
  ) {}

  @Post(':id/images/uploads')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request a signed URL for a direct image upload',
    description:
      'Returns a short-lived URL. The client PUTs the file there with the returned headers, ' +
      'then registers it with POST /admin/products/:id/images using uploadKey.',
  })
  createImageUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createImageUploadSchema))
    dto: CreateImageUploadInput,
  ) {
    return this.media.createUploadTicket(id, dto);
  }

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
