import { Migration } from '@mikro-orm/migrations';

export class Migration20261019142245 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create schema if not exists "notifications";`);
    this.addSql(
      `create table "notifications"."sent_email" ("id" uuid not null default gen_random_uuid(), "event_id" uuid not null, "type" varchar(255) not null, "recipient" varchar(255) not null, "subject" varchar(255) not null, "status" text not null, "error" text null, "created_at" timestamptz not null, "sent_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "notifications"."sent_email" add constraint "sent_email_event_id_type_unique" unique ("event_id", "type");`,
    );

    this.addSql(
      `alter table "notifications"."sent_email" add constraint "sent_email_status_check" check ("status" in ('PENDING', 'SENT', 'FAILED'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "notifications"."sent_email" cascade;`);

    this.addSql(`drop schema if exists "notifications";`);
  }
}
