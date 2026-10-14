import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlaceOrderUseCase } from '../../../application/use-cases/place-order/place-order.use-case';
import { PlaceOrderCommand } from '../../../application/use-cases/place-order/place-order.command';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { CurrentUser } from '../../../../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { type PlaceOrderDto, placeOrderSchema } from '@ironoak/contracts';

@Controller('orders')
export class PlaceOrderController {
  constructor(private readonly placeOrder: PlaceOrderUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async place(
    @Body(new ZodValidationPipe(placeOrderSchema)) dto: PlaceOrderDto,
    @CurrentUser() user: { userId: string },
  ): Promise<{ orderId: string }> {
    return this.placeOrder.execute(
      new PlaceOrderCommand(
        user.userId,
        dto.lines.map((i) => ({
          productVariantId: i.productVariantId,
          quantity: i.quantity,
        })),
        dto.deliveryAddress,
        dto.shippingMethod,
      ),
    );
  }
}
