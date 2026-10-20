export interface CustomerDirectory {
  emailOf(customerId: string): Promise<string | null>;
}

export const CUSTOMER_DIRECTORY = Symbol('CUSTOMER_DIRECTORY');
