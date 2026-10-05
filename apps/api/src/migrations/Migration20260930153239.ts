import { Migration } from '@mikro-orm/migrations';

export class Migration20260930153239 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "catalog"."product_image" add "type" text not null default 'IMAGE', add "poster_key" varchar(255) null;`,
    );
    this.addSql(
      `create unique index "product_image_one_video_idx" on "catalog"."product_image" ("product_id") where "type" = 'VIDEO';`,
    );
    this.addSql(
      `alter table "catalog"."product_image" add constraint "product_image_type_check" check ("type" in ('IMAGE', 'VIDEO'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index "catalog"."product_image_one_video_idx";`);
    this.addSql(
      `alter table "catalog"."product_image" drop constraint "product_image_type_check";`,
    );
    this.addSql(
      `alter table "catalog"."product_image" drop column "type", drop column "poster_key";`,
    );
  }
}
