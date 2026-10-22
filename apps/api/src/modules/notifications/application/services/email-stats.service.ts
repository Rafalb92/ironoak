import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AdminEmailStats } from '@ironoak/contracts';

const EMAIL_STATS_SQL = `
  select "status", count(*)::int as count
  from "notifications"."sent_email"
  where "created_at" >= now() - interval '7 days'
  group by "status"`;

/** Deliverability at a glance: a FAILED count above zero means SMTP needs attention. */
@Injectable()
export class EmailStatsService {
  constructor(private readonly em: EntityManager) {}

  async lastWeek(): Promise<AdminEmailStats> {
    const rows = await this.em
      .getConnection()
      .execute<{ status: string; count: number }[]>(EMAIL_STATS_SQL);
    const count = (status: string) =>
      rows.find((row) => row.status === status)?.count ?? 0;

    return {
      sent: count('SENT'),
      failed: count('FAILED'),
      pending: count('PENDING'),
    };
  }
}
