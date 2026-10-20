import { Migration } from '@mikro-orm/migrations';

export class Migration20261020141055 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "notifications"."sent_email" add "order_id" uuid null;`,
    );
    this.addSql(
      `create index "sent_email_order_id_index" on "notifications"."sent_email" ("order_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "notifications"."sent_email_order_id_index";`);
    this.addSql(
      `alter table "notifications"."sent_email" drop column "order_id";`,
    );
  }
}
