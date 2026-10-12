import { Migration } from '@mikro-orm/migrations';

export class Migration20261012143016 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "identity"."customer_address" ("id" uuid not null default gen_random_uuid(), "user_id" uuid not null, "street" varchar(255) not null, "building_number" varchar(255) not null, "apartment_number" varchar(255) null, "city" varchar(255) not null, "postal_code" varchar(255) not null, "country" varchar(255) not null, "is_default" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "customer_address_user_id_index" on "identity"."customer_address" ("user_id");`,
    );
    this.addSql(
      `create unique index "customer_address_one_default_idx" on "identity"."customer_address" ("user_id") where "is_default" = true;`,
    );

    this.addSql(
      `alter table "identity"."customer_address" add constraint "customer_address_user_id_foreign" foreign key ("user_id") references "identity"."user" ("id") on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "identity"."customer_address" cascade;`);
  }
}
