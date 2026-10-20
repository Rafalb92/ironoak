import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  EMAIL_SENDER,
  type EmailSender,
  type OutgoingEmail,
} from '../ports/email-sender.port';
import { SentEmailSchema } from '../../adapters/out/persistence/sent-email.entity';

export interface EmailKey {
  eventId: string;
  type: string;
  /** links the email to an order, so the admin can list them */
  orderId?: string;
}

/**
 * Sends one email per (event, type), recording every attempt.
 *
 * SENT already → skip. Otherwise: record PENDING, send, mark SENT. A failure
 * is recorded as FAILED and rethrown, so runOnce releases the inbox claim and
 * a replay retries. The only duplicate window is a crash between the SMTP
 * send and the SENT update — at-least-once, like the rest of the outbox.
 */
@Injectable()
export class EmailDispatcher {
  constructor(
    private readonly em: EntityManager,
    @Inject(EMAIL_SENDER) private readonly sender: EmailSender,
  ) {}

  async dispatch(key: EmailKey, email: OutgoingEmail): Promise<void> {
    const em = this.em.fork();

    let record = await em.findOne(SentEmailSchema, {
      eventId: key.eventId,
      type: key.type,
    });
    if (record?.status === 'SENT') return;

    if (record) {
      record.recipient = email.to;
      record.subject = email.subject;
      record.orderId = key.orderId ?? null;
      record.status = 'PENDING';
    } else {
      record = em.create(SentEmailSchema, {
        eventId: key.eventId,
        type: key.type,
        orderId: key.orderId ?? null,
        recipient: email.to,
        subject: email.subject,
        status: 'PENDING',
      });
    }
    await em.flush();

    try {
      await this.sender.send(email);
      record.status = 'SENT';
      record.sentAt = new Date();
      record.error = null;
      await em.flush();
    } catch (error) {
      record.status = 'FAILED';
      record.error = error instanceof Error ? error.message : String(error);
      await em.flush();
      throw error;
    }
  }
}
