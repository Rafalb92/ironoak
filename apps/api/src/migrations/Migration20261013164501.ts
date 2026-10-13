import { Migration } from '@mikro-orm/migrations';

export class Migration20261013164501 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "ordering"."order" add "shipping_method" varchar(255) not null default 'STANDARD', add "shipping_amount" int not null default 0;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "ordering"."order" drop column "shipping_method", drop column "shipping_amount";`,
    );
  }
}
