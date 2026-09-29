import { Migration } from '@mikro-orm/migrations';

export class Migration20260928140210 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "catalog"."product_image" add "storage_key" varchar(255) null;`,
    );
    this.addSql(
      `alter table "catalog"."product_image" alter column "url" drop not null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "catalog"."product_image" drop column "storage_key";`,
    );
    this.addSql(
      `alter table "catalog"."product_image" alter column "url" set not null;`,
    );
  }
}
