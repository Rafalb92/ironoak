import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from '@mikro-orm/postgresql';
import { runOnce } from '../../../../shared-infra/inbox/run-once';
import { CatalogEventName } from '../../../catalog/events/catalog-event-names';
import { CreateStockItemUseCase } from '../use-cases/create-stock/create-stock.use-case';

interface IntegrationEvent {
  eventId: string;
  payload: { productVariantId: string; initialStock: number };
}

@Injectable()
export class InventoryVariantCreatedListener {
  private readonly logger = new Logger(InventoryVariantCreatedListener.name);

  constructor(
    private readonly em: EntityManager,
    private readonly createStockItem: CreateStockItemUseCase,
  ) {}

  @OnEvent(CatalogEventName.VARIANT_CREATED, { promisify: true })
  async handle(event: IntegrationEvent): Promise<void> {
    await runOnce(
      this.em,
      event.eventId,
      InventoryVariantCreatedListener.name,
      this.logger,
      () =>
        this.createStockItem.execute(
          event.payload.productVariantId,
          event.payload.initialStock,
        ),
    );
  }
}
