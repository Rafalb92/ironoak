import { Migration } from '@mikro-orm/migrations';

export class Migration20260824151936 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "inbox"."inbox_message" alter column "event_id" type text using ("event_id"::text);`,
    );

    this.addSql(
      `alter table "inbox"."inbox_message" alter column "event_id" type varchar(255) using ("event_id"::varchar(255));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "inbox"."inbox_message" alter column "event_id" type uuid using ("event_id"::text::uuid);`,
    );
  }
}
