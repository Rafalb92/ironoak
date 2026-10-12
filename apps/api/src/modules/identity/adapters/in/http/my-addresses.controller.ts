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
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  createSavedAddressSchema,
  updateSavedAddressSchema,
  type CreateSavedAddressInput,
  type SavedAddress,
  type UpdateSavedAddressInput,
} from '@ironoak/contracts';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { CustomerAddressService } from '../../../application/services/customer-address.service';

@ApiTags('account')
@ApiCookieAuth('access_token')
@Controller('me/addresses')
@UseGuards(JwtAuthGuard)
export class MyAddressesController {
  constructor(private readonly addresses: CustomerAddressService) {}

  @Get()
  @ApiOperation({
    summary: 'My saved addresses',
    description: 'Default first, then newest.',
  })
  list(@CurrentUser() user: { userId: string }): Promise<SavedAddress[]> {
    return this.addresses.list(user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save an address',
    description:
      'The first address becomes the default. Saving an address identical to an existing ' +
      'one returns the existing entry instead of a duplicate.',
  })
  @ApiResponse({ status: 409, description: 'Address book is full' })
  create(
    @Body(new ZodValidationPipe(createSavedAddressSchema))
    dto: CreateSavedAddressInput,
    @CurrentUser() user: { userId: string },
  ): Promise<SavedAddress> {
    return this.addresses.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit an address or make it the default' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Not found or not yours' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateSavedAddressSchema))
    dto: UpdateSavedAddressInput,
    @CurrentUser() user: { userId: string },
  ): Promise<SavedAddress> {
    return this.addresses.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an address',
    description: 'Deleting the default promotes the newest remaining address.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Not found or not yours' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ): Promise<void> {
    await this.addresses.remove(user.userId, id);
  }
}
