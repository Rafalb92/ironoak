import { useMutation, useQueryCache } from '@pinia/colada';
import { ORDER_QUERY_KEYS } from '../queries/orders';

type OrderAction = 'fulfill' | 'ship' | 'deliver';

const ACTION_LABELS: Record<OrderAction, string> = {
  fulfill: 'Fulfillment started',
  ship: 'Marked as shipped',
  deliver: 'Marked as delivered',
};

export function useOrderAction() {
  const cache = useQueryCache();
  const api = useApi();
  const toast = useToast();

  return useMutation({
    mutation: ({ orderId, action }: { orderId: string; action: OrderAction }) =>
      api(`/admin/orders/${orderId}/${action}`, { method: 'POST' }),

    onSuccess: (_data, { action }) => {
      toast.success(ACTION_LABELS[action]);
      cache.invalidateQueries({ key: ORDER_QUERY_KEYS.root });
    },

    onError: (error) => {
      // 409 z maszyny stanów niesie czytelny komunikat domenowy
      const message = (error as { data?: { message?: string } })?.data?.message ?? 'Action failed';
      toast.error('Cannot perform this action', message);
    },
  });
}
