export const PaymentEventName = {
  SUCCEEDED: 'payment.succeeded',
  FAILED: 'payment.failed',
} as const;

export type PaymentEventName =
  (typeof PaymentEventName)[keyof typeof PaymentEventName];
