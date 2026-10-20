import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AdminOrderEmail } from '@ironoak/contracts';
import { SentEmailSchema } from '../../adapters/out/persistence/sent-email.entity';

/** Read side of the email log — a straight read of the persistence model (ADR-0016). */
@Injectable()
export class SentEmailQueryService {
  constructor(private readonly em: EntityManager) {}

  async forOrder(orderId: string): Promise<AdminOrderEmail[]> {
    const emails = await this.em.find(
      SentEmailSchema,
      { orderId },
      { orderBy: { createdAt: 'asc' } },
    );

    return emails.map((email) => ({
      id: email.id,
      type: email.type,
      recipient: email.recipient,
      subject: email.subject,
      status: email.status,
      error: email.error ?? null,
      createdAt: email.createdAt,
      sentAt: email.sentAt ?? null,
    }));
  }
}
