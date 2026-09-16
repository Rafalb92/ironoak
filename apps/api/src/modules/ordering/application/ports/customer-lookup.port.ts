export const CUSTOMER_LOOKUP = Symbol('CUSTOMER_LOOKUP');

export interface Customer {
  customerId: string;
  email: string;
}

export interface CustomerLookup {
  findByIds(customerIds: string[]): Promise<Customer[]>;
  findIdsByEmail(fragment: string): Promise<string[]>;
}
