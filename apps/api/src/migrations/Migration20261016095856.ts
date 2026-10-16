import { Migration } from '@mikro-orm/migrations';

export class Migration20261016095856 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "identity"."customer_address" add "recipient_name" varchar(255) null, add "phone" varchar(255) null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "identity"."customer_address" drop column "recipient_name", drop column "phone";`,
    );
  }
}
