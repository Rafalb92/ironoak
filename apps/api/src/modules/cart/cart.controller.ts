import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { CartService } from './cart.service';
import {
  addItemSchema,
  type AddItemDto,
  updateQuantitySchema,
  type UpdateQuantityDto,
  mergeCartSchema,
  type MergeCartDto,
} from './dto/cart.schema';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({
    status: 200,
    description: 'Current user cart with items and total price',
  })
  get(@CurrentUser() user: { userId: string }) {
    return this.cart.getCart(user.userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 200,
    description: 'Item added to cart with updated cart state',
  })
  @ApiBody({
    description: 'Product variant ID and quantity to add to cart',
    schema: {
      type: 'object',
      properties: {
        productVariantId: { type: 'string' },
        quantity: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 404, description: 'Product variant not found' })
  @ApiResponse({ status: 409, description: 'Insufficient stock for variant' })
  @HttpCode(HttpStatus.OK)
  addItem(
    @Body(new ZodValidationPipe(addItemSchema)) dto: AddItemDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.cart.addItem(user.userId, dto.productVariantId, dto.quantity);
  }

  @Patch('items/:variantId')
  updateQuantity(
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(updateQuantitySchema)) dto: UpdateQuantityDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.cart.updateQuantity(user.userId, variantId, dto.quantity);
  }

  @Delete('items/:variantId')
  removeItem(
    @Param('variantId') variantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.cart.removeItem(user.userId, variantId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clear(@CurrentUser() user: { userId: string }): Promise<void> {
    await this.cart.clear(user.userId);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  merge(
    @Body(new ZodValidationPipe(mergeCartSchema)) dto: MergeCartDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.cart.merge(user.userId, dto.items);
  }
}
