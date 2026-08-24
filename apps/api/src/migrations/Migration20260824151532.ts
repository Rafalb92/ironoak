import { Migration } from '@mikro-orm/migrations';

export class Migration20260824151532 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "payments"."payment" alter column "checkout_url" type text using ("checkout_url"::text);`,
    );
    this.addSql(
      `alter table "payments"."payment" alter column "provider_session_id" type text using ("provider_session_id"::text);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "payments"."payment" alter column "provider_session_id" type varchar(255) using ("provider_session_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "payments"."payment" alter column "checkout_url" type varchar(255) using ("checkout_url"::varchar(255));`,
    );
  }
}
