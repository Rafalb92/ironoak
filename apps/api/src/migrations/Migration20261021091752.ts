import { Migration } from '@mikro-orm/migrations';

export class Migration20261021091752 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "identity"."user" drop constraint "user_role_check";`,
    );
    this.addSql(
      `alter table "identity"."user" add constraint "user_role_check" check ("role" in ('USER', 'ADMIN', 'DEMO_ADMIN'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "identity"."user" drop constraint "user_role_check";`,
    );
    this.addSql(
      `alter table "identity"."user" add constraint "user_role_check" check ("role" in ('USER', 'ADMIN'));`,
    );
  }
}
