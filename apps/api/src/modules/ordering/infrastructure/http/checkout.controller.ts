import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation.pipe';
import { CartService } from '../../../cart/cart.service';
import { PlaceOrderUseCase } from '../../application/use-cases/place-order/place-order.use-case';
import { PlaceOrderCommand } from '../../application/use-cases/place-order/place-order.command';
import { checkoutSchema, type CheckoutDto } from './dto/checkout.schema';

@ApiTags('orders')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(
    private readonly cart: CartService,
    private readonly placeOrder: PlaceOrderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Place an order from the current cart',
    description:
      'Reads the cart, fetches current prices from the catalog, creates the order ' +
      'and clears the cart. Prices are never taken from the client — the aggregate ' +
      'computes the total from catalog prices at this moment.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['deliveryAddress'],
      properties: {
        deliveryAddress: {
          type: 'object',
          required: [
            'street',
            'buildingNumber',
            'city',
            'postalCode',
            'country',
          ],
          properties: {
            street: { type: 'string', example: 'Main Street' },
            buildingNumber: { type: 'string', example: '123' },
            apartmentNumber: { type: 'string', example: '4B' },
            city: { type: 'string', example: 'New York' },
            postalCode: { type: 'string', example: '10001' },
            country: { type: 'string', example: 'US' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Order created',
    schema: {
      type: 'object',
      properties: { orderId: { type: 'string', format: 'uuid' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Cart is empty or address invalid' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({
    status: 404,
    description: 'One of the cart variants is no longer available',
  })
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
