import { Migration } from '@mikro-orm/migrations';

export class Migration20260816123147 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create schema if not exists "inventory";`);
    this.addSql(
      `create table "inventory"."stock_item" ("id" uuid not null, "product_variant_id" uuid not null, "quantity_on_hand" int not null, "quantity_reserved" int not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "inventory"."stock_item" add constraint "stock_item_product_variant_id_unique" unique ("product_variant_id");`,
    );

    this.addSql(
      `alter table "inventory"."stock_item" add constraint "stock_item_on_hand_non_negative" check (quantity_on_hand >= 0);`,
    );
    this.addSql(
      `alter table "inventory"."stock_item" add constraint "stock_item_reserved_non_negative" check (quantity_reserved >= 0);`,
    );
    this.addSql(
      `alter table "inventory"."stock_item" add constraint "stock_item_reserved_lte_on_hand" check (quantity_reserved <= quantity_on_hand);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "inventory"."stock_item" cascade;`);

    this.addSql(`drop schema if exists "inventory";`);
  }
}
