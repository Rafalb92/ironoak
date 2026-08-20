import { Migration } from '@mikro-orm/migrations';

export class Migration20260820114028 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create schema if not exists "payments";`);
    this.addSql(
      `create table "payments"."payment" ("id" uuid not null, "order_id" uuid not null, "amount" int not null, "currency" varchar(255) not null, "status" varchar(255) not null, "provider_session_id" varchar(255) null, "checkout_url" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "payment_order_id_index" on "payments"."payment" ("order_id");`,
    );
    this.addSql(
      `create index "payment_provider_session_id_index" on "payments"."payment" ("provider_session_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "payments"."payment" cascade;`);

    this.addSql(`drop schema if exists "payments";`);
  }
}
