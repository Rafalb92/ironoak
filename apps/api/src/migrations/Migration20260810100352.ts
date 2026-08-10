import { Migration } from '@mikro-orm/migrations';

export class Migration20260810100352 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "identity"."user" alter column "role" type text using ("role"::text);`,
    );
    this.addSql(
      `alter table "identity"."user" add constraint "user_role_check" check ("role" in ('USER', 'ADMIN'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "identity"."user" drop constraint "user_role_check";`,
    );
    this.addSql(
      `alter table "identity"."user" alter column "role" type varchar(255) using ("role"::varchar(255));`,
    );
  }
}
