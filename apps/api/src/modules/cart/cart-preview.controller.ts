import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { previewCartSchema, type PreviewCartInput } from '@ironoak/contracts';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CartService } from './cart.service';

/**
 * Public on purpose: a guest cart lives in the browser, but prices, names and
 * availability must come from the server. Nothing is stored.
 */
@ApiTags('cart')
@Controller('cart')
export class CartPreviewController {
  constructor(private readonly cart: CartService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Price a guest cart',
    description:
      'Returns the same cart view as GET /cart for items held by the client. ' +
      'Duplicate variants are merged. Nothing is persisted.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart view with current prices and availability',
  })
  @ApiResponse({ status: 400, description: 'Invalid items' })
  preview(
    @Body(new ZodValidationPipe(previewCartSchema)) dto: PreviewCartInput,
  ) {
    return this.cart.preview(dto.items);
  }
}
