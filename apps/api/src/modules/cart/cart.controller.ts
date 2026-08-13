// modules/cart/cart.controller.ts
import {
  BadRequestException,
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
import { PlaceOrderCommand } from '../ordering/application/use-cases/place-order/place-order.command';
import { type CheckoutDto, checkoutSchema } from './dto/checkout.schema';
import { PlaceOrderUseCase } from '../ordering/application/use-cases/place-order/place-order.use-case';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(
    private readonly cart: CartService,
    private readonly placeOrder: PlaceOrderUseCase,
  ) {}

  @Get()
  get(@CurrentUser() user: { userId: string }) {
    return this.cart.getCart(user.userId);
  }

  @Post('items')
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

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(
    @Body(new ZodValidationPipe(checkoutSchema)) dto: CheckoutDto,
    @CurrentUser() user: { userId: string },
  ): Promise<{ orderId: string }> {
    const items = await this.cart.getRawItems(user.userId);
    if (items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const result = await this.placeOrder.execute(
      new PlaceOrderCommand(
        user.userId,
        items.map((i) => ({
          productVariantId: i.productVariantId,
          quantity: i.quantity,
        })),
        dto.deliveryAddress,
      ),
    );

    await this.cart.clear(user.userId);
    return result;
  }
}
