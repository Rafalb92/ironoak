import { Order } from '../../domain/order.aggregate';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepository {
  // znajdź zamówienie po id - do use case'ów
  findById(id: string): Promise<Order | null>;

  // historia zamówień danego klienta, najnowsze pierwsze
  findByCustomerId(customerId: string): Promise<Order[]>;

  // zapisz nowe LUB zaktualizuj
  save(order: Order): Promise<void>;
}
