import { defineQueryOptions } from '@pinia/colada';
import {
  adminDashboardOrdersSchema,
  adminEmailStatsSchema,
  adminLowStockListSchema,
} from '@ironoak/contracts';

const DASHBOARD_KEY = ['dashboard'] as const;

export const dashboardOrdersQuery = defineQueryOptions({
  key: [...DASHBOARD_KEY, 'orders'],
  query: async () => adminDashboardOrdersSchema.parse(await useApi()('/admin/dashboard/orders')),
  staleTime: 30_000,
});

export const dashboardLowStockQuery = defineQueryOptions({
  key: [...DASHBOARD_KEY, 'low-stock'],
  query: async () => adminLowStockListSchema.parse(await useApi()('/admin/dashboard/low-stock')),
  staleTime: 30_000,
});

export const dashboardEmailsQuery = defineQueryOptions({
  key: [...DASHBOARD_KEY, 'emails'],
  query: async () => adminEmailStatsSchema.parse(await useApi()('/admin/dashboard/emails')),
  staleTime: 30_000,
});
