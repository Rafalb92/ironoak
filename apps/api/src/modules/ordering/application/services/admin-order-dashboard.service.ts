import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AdminDashboardOrders } from '@ironoak/contracts';

// revenue counts only money actually taken
const PAID_STATUSES = ['PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED'];

const LAST_30_DAYS_SQL = `
  select count(*)::int as orders, coalesce(sum("total_amount"), 0)::int as revenue
  from "ordering"."order"
  where "status" in (?) and "created_at" >= now() - interval '30 days'`;

const BY_STATUS_SQL = `
  select "status", count(*)::int as count
  from "ordering"."order"
  group by "status"`;

// generate_series fills days without sales with zero — no gaps in the chart
const DAILY_REVENUE_SQL = `
  select d::date as day,
         coalesce(sum(o."total_amount"), 0)::int as revenue,
         count(o."id")::int as orders
  from generate_series(current_date - interval '13 days', current_date, interval '1 day') d
  left join "ordering"."order" o
    on o."created_at"::date = d::date and o."status" in (?)
  group by d
  order by d`;

/** Read side for the admin dashboard — Ordering answers only questions about orders. */
@Injectable()
export class AdminOrderDashboardService {
  constructor(private readonly em: EntityManager) {}

  async summary(): Promise<AdminDashboardOrders> {
    const connection = this.em.getConnection();

    const [[totals], statusRows, dailyRows] = await Promise.all([
      connection.execute<{ orders: number; revenue: number }[]>(
        LAST_30_DAYS_SQL,
        [PAID_STATUSES],
      ),
      connection.execute<{ status: string; count: number }[]>(BY_STATUS_SQL),
      connection.execute<{ day: Date; revenue: number; orders: number }[]>(
        DAILY_REVENUE_SQL,
        [PAID_STATUSES],
      ),
    ]);

    const orders = totals?.orders ?? 0;
    const revenue = totals?.revenue ?? 0;

    return {
      last30Days: {
        orders,
        revenue,
        averageOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
      },
      byStatus: Object.fromEntries(
        statusRows.map((row) => [row.status, row.count]),
      ),
      dailyRevenue: dailyRows.map((row) => ({
        day: row.day,
        revenue: row.revenue,
        orders: row.orders,
      })),
    };
  }
}
