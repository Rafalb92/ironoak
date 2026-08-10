import { Migration } from '@mikro-orm/migrations';

export class Migration20260809144502 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "identity"."user" add "role" smallint not null default 0;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "identity"."user" drop column "role";`);
  }
}
