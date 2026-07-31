import { Migration } from '@mikro-orm/migrations';

export class Migration20260731141149 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create schema if not exists "ordering";`);
    this.addSql(
      `create table "ordering"."order" ("id" uuid not null, "customer_id" uuid not null, "status" varchar(255) not null, "total_amount" int not null, "currency" varchar(255) not null, "delivery_address" jsonb not null, "lines" jsonb not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "ordering"."order" cascade;`);

    this.addSql(`drop schema if exists "ordering";`);
  }
}
