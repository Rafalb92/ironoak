import { Injectable } from '@nestjs/common';
import { CustomerQueryService } from '../../../../identity/application/services/customer-query.service';
import type { CustomerDirectory } from '../../../application/ports/customer-directory.port';

@Injectable()
export class IdentityCustomerDirectory implements CustomerDirectory {
  constructor(private readonly customers: CustomerQueryService) {}

  async emailOf(customerId: string): Promise<string | null> {
    const [customer] = await this.customers.findByIds([customerId]);
    return customer?.email ?? null;
  }
}
