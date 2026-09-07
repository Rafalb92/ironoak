import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CatalogEventName } from 'src/modules/catalog/events/catalog-event-names';
import { InboxMessageEntity } from 'src/shared-infra/inbox/inbox-message.entity';
import { CreateStockItemUseCase } from '../use-cases/create-stock/create-stock.use-case';

@Injectable()
export class InventoryVariantCreatedListener {
  private readonly logger = new Logger(InventoryVariantCreatedListener.name);

  constructor(
    private readonly em: EntityManager,
    private readonly createStockItem: CreateStockItemUseCase,
  ) {}

  @OnEvent(CatalogEventName.VARIANT_CREATED, { promisify: true })
  async handle(event: {
    eventId: string;
    payload: { productVariantId: string; initialStock: number };
  }): Promise<void> {
    const handlerName = InventoryVariantCreatedListener.name;
    const em = this.em.fork();

    try {
      em.create(InboxMessageEntity, { eventId: event.eventId, handlerName });
      await em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) return;
      throw error;
    }

    await this.createStockItem.execute(
      event.payload.productVariantId,
      event.payload.initialStock,
    );
  }
}
