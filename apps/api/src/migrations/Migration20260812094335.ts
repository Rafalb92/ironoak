import { Migration } from '@mikro-orm/migrations';

export class Migration20260812094335 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create schema if not exists "inbox";`);
    this.addSql(
      `create table "inbox"."inbox_message" ("event_id" uuid not null, "handler_name" varchar(255) not null, "processed_at" timestamptz not null, primary key ("event_id", "handler_name"));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "inbox"."inbox_message" cascade;`);

    this.addSql(`drop schema if exists "inbox";`);
  }
}
