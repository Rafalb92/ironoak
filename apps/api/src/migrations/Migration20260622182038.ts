import { Migration } from '@mikro-orm/migrations';

export class Migration20260622182038 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "health" ("id" serial primary key, "created_at" date not null default CURRENT_TIMESTAMP);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "health" cascade;`);
  }
}
