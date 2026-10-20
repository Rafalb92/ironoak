export interface OrderForEmail {
  id: string;
  customerId: string;
  createdAt: Date;
  currency: string;
  lines: { productName: string; quantity: number; lineTotal: number }[];
  subtotalAmount: number;
  shippingName: string;
  shippingAmount: number;
  totalAmount: number;
  address: {
    recipientName: string | null;
    phone: string | null;
    street: string;
    buildingNumber: string;
    apartmentNumber: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
}

/** Notifications' own view of an order — only what an email needs. */
export interface OrderReader {
  findForEmail(orderId: string): Promise<OrderForEmail | null>;
}

export const ORDER_READER = Symbol('ORDER_READER');
