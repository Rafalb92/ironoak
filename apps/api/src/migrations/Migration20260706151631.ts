import { Migration } from '@mikro-orm/migrations';

export class Migration20260706151631 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "identity"."account" ("id" uuid not null default gen_random_uuid(), "user_id" uuid not null, "provider_id" varchar(255) not null, "account_id" varchar(255) not null, "password" varchar(255) null, "access_token" varchar(255) null, "refresh_token" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `alter table "identity"."account" add constraint "account_user_id_foreign" foreign key ("user_id") references "identity"."user" ("id") on delete cascade;`,
    );

    this.addSql(`alter table "identity"."user" drop column "password_hash";`);
    this.addSql(
      `alter table "identity"."user" add "email_verified" boolean not null default false;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "identity"."account" cascade;`);

    this.addSql(`alter table "identity"."user" drop column "email_verified";`);
    this.addSql(
      `alter table "identity"."user" add "password_hash" varchar(255) not null;`,
    );
  }
}
