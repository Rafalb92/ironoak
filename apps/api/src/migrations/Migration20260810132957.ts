import { Migration } from '@mikro-orm/migrations';

export class Migration20260810132957 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create schema if not exists "outbox";`);
    this.addSql(
      `create table "outbox"."outbox_message" ("id" bigint generated always as identity not null primary key, "event_id" uuid not null, "aggregate_id" uuid not null, "aggregate_type" varchar(255) not null, "event_name" varchar(255) not null, "payload" jsonb not null, "occurred_at" timestamptz not null, "created_at" timestamptz not null, "processed_at" timestamptz null, "attempts" int not null default 0, "last_error" text null);`,
    );
    this.addSql(
      `alter table "outbox"."outbox_message" add constraint "outbox_message_event_id_unique" unique ("event_id");`,
    );
    this.addSql(
      `create index "outbox_pending_idx" on "outbox"."outbox_message" ("id") where "processed_at" is null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "outbox"."outbox_message" cascade;`);

    this.addSql(`drop schema if exists "outbox";`);
  }
}
