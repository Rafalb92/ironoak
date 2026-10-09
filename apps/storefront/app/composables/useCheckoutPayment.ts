import type { InitiatePaymentResult } from '@ironoak/contracts';

/**
 * Starts (or resumes) payment for a placed order and leaves the app for the
 * provider's hosted page. Safe to retry: the API returns the same session.
 */
export function useCheckoutPayment() {
  const api = useApi();

  async function startPayment(orderId: string): Promise<void> {
    const result = await api<InitiatePaymentResult>(`/orders/${orderId}/pay`, { method: 'POST' });
    await navigateTo(result.checkoutUrl, { external: true });
  }

  return { startPayment };
}
