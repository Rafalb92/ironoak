import { Migration } from '@mikro-orm/migrations';

export class Migration20260706122447 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create schema if not exists "identity";`);
    this.addSql(
      `create table "identity"."user" ("id" uuid not null default gen_random_uuid(), "email" varchar(255) not null, "password_hash" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "identity"."user" add constraint "user_email_unique" unique ("email");`,
    );

    this.addSql(`drop table if exists "health" cascade;`);
  }

  override down(): void | Promise<void> {
    this.addSql(
      `create table "health" ("created_at" date not null default CURRENT_TIMESTAMP, "id" serial primary key);`,
    );

    this.addSql(`drop table if exists "identity"."user" cascade;`);

    this.addSql(`drop schema if exists "identity";`);
  }
}
