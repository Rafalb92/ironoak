import { Migration } from '@mikro-orm/migrations';

export class Migration20260925111105 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "catalog"."product_sales" ("product_id" uuid not null, "units_sold" int not null default 0, "updated_at" timestamptz not null, primary key ("product_id"));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "catalog"."product_sales" cascade;`);
  }
}
