// shared-infra/outbox/outbox.module.ts
import { Module } from '@nestjs/common';
import { OutboxPublisherService } from './outbox-publisher.service';
import { OutboxCleanupService } from './outbox-cleanup.service';

@Module({
  providers: [OutboxPublisherService, OutboxCleanupService],
})
export class OutboxModule {}
