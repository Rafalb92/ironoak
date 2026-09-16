import { Injectable } from '@nestjs/common';
import { CustomerQueryService } from '../../../identity/application/services/customer-query.service';
import type {
  CustomerLookup,
  Customer,
} from '../../application/ports/customer-lookup.port';

@Injectable()
export class IdentityCustomerLookup implements CustomerLookup {
  constructor(private readonly customers: CustomerQueryService) {}

  async findByIds(customerIds: string[]): Promise<Customer[]> {
    const users = await this.customers.findByIds(customerIds);
    return users.map((u) => ({ customerId: u.userId, email: u.email }));
  }

  findIdsByEmail(fragment: string): Promise<string[]> {
    return this.customers.findIdsByEmail(fragment);
  }
}
