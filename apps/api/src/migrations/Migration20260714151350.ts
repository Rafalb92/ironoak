import { Migration } from '@mikro-orm/migrations';

export class Migration20260714151350 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create schema if not exists "catalog";`);
    this.addSql(
      `create table "catalog"."category" ("id" uuid not null default gen_random_uuid(), "name" varchar(255) not null, "slug" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "catalog"."category" add constraint "category_slug_unique" unique ("slug");`,
    );

    this.addSql(
      `create table "catalog"."product" ("id" uuid not null default gen_random_uuid(), "name" varchar(255) not null, "slug" varchar(255) not null, "description" text not null, "category_id" uuid not null, "active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "catalog"."product" add constraint "product_slug_unique" unique ("slug");`,
    );

    this.addSql(
      `create table "catalog"."product_variant" ("id" uuid not null default gen_random_uuid(), "product_id" uuid not null, "sku" varchar(255) not null, "name" varchar(255) not null, "price" int not null, "weight_grams" int null, "color" varchar(255) null, "material" varchar(255) null, "finish" varchar(255) null, "attributes" jsonb null, "active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "catalog"."product_variant" add constraint "product_variant_sku_unique" unique ("sku");`,
    );

    this.addSql(
      `create table "catalog"."product_image" ("id" uuid not null default gen_random_uuid(), "product_id" uuid not null, "variant_id" uuid null, "url" varchar(255) not null, "alt" varchar(255) not null, "role" varchar(255) not null, "position" int not null default 0, "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `alter table "catalog"."product" add constraint "product_category_id_foreign" foreign key ("category_id") references "catalog"."category" ("id");`,
    );

    this.addSql(
      `alter table "catalog"."product_variant" add constraint "product_variant_product_id_foreign" foreign key ("product_id") references "catalog"."product" ("id");`,
    );

    this.addSql(
      `alter table "catalog"."product_image" add constraint "product_image_product_id_foreign" foreign key ("product_id") references "catalog"."product" ("id");`,
    );
    this.addSql(
      `alter table "catalog"."product_image" add constraint "product_image_variant_id_foreign" foreign key ("variant_id") references "catalog"."product_variant" ("id") on delete set null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "catalog"."product" drop constraint "product_category_id_foreign";`,
    );
    this.addSql(
      `alter table "catalog"."product_variant" drop constraint "product_variant_product_id_foreign";`,
    );
    this.addSql(
      `alter table "catalog"."product_image" drop constraint "product_image_product_id_foreign";`,
    );
    this.addSql(
      `alter table "catalog"."product_image" drop constraint "product_image_variant_id_foreign";`,
    );

    this.addSql(`drop table if exists "catalog"."category" cascade;`);
    this.addSql(`drop table if exists "catalog"."product" cascade;`);
    this.addSql(`drop table if exists "catalog"."product_variant" cascade;`);
    this.addSql(`drop table if exists "catalog"."product_image" cascade;`);

    this.addSql(`drop schema if exists "catalog";`);
  }
}
