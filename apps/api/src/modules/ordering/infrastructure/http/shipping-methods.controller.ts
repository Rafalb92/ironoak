import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ShippingOption } from '@ironoak/contracts';
import { ShippingMethod } from '../../domain/value-objects/shipping-method.vo';

/** Public: guests see delivery options and prices before signing in. */
@ApiTags('orders')
@Controller('shipping-methods')
export class ShippingMethodsController {
  @Get()
  @ApiOperation({
    summary: 'Available delivery options',
    description:
      'Prices come from the server; checkout sends only the option code.',
  })
  list(): ShippingOption[] {
    return ShippingMethod.all().map((method) => ({
      code: method.code,
      name: method.name,
      description: method.description,
      estimate: method.estimate,
      price: method.price.amount,
      currency: method.price.currency,
    }));
  }
}
