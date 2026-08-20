import { Injectable } from '@nestjs/common';
import { OrderQueryService } from '../../../ordering/application/services/order-query.service';
import type {
  OrderLookup,
  PayableOrder,
} from '../../application/ports/order-lookup.port';

@Injectable()
export class OrderRepositoryOrderLookup implements OrderLookup {
  constructor(private readonly orderQuery: OrderQueryService) {}

  findPayable(
    orderId: string,
    customerId: string,
  ): Promise<PayableOrder | null> {
    return this.orderQuery.findForPayment(orderId, customerId);
  }
}
