// shared-infra/outbox/outbox.module.ts
import { Module } from '@nestjs/common';
import { OutboxPublisherService } from './outbox-publisher.service';

@Module({
  providers: [OutboxPublisherService],
})
export class OutboxModule {}
