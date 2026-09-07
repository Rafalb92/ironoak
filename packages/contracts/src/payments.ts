import { z } from 'zod';

// --- wejście ---
export const simulatePaymentSchema = z.object({
  outcome: z.enum(['success', 'failure']).default('success'),
});
export type SimulatePaymentInput = z.infer<typeof simulatePaymentSchema>;

// --- wyjście ---
export const paymentStatusSchema = z.enum(['PENDING', 'SUCCEEDED', 'FAILED']);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const initiatePaymentResultSchema = z.object({
  checkoutUrl: z.string(),
});
export type InitiatePaymentResult = z.infer<typeof initiatePaymentResultSchema>;

export const webhookReceivedSchema = z.object({
  received: z.literal(true),
});
export type WebhookReceived = z.infer<typeof webhookReceivedSchema>;

export const simulatePaymentResultSchema = z.object({
  simulated: z.enum(['success', 'failure']),
});
export type SimulatePaymentResult = z.infer<typeof simulatePaymentResultSchema>;
