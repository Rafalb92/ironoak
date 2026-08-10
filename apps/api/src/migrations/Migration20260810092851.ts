import { Migration } from '@mikro-orm/migrations';

export class Migration20260810092851 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "identity"."user" alter column "role" type varchar(255) using ("role"::varchar(255));`,
    );
    this.addSql(
      `alter table "identity"."user" alter column "role" set default 'USER';`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "identity"."user" alter column "role" type smallint using ("role"::smallint);`,
    );
    this.addSql(
      `alter table "identity"."user" alter column "role" set default 0;`,
    );
  }
}
