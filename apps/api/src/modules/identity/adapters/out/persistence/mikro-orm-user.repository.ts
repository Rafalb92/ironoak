import { EntityManager } from '@mikro-orm/postgresql';
import type { UserRepository } from '../../../application/ports/user.repository.port';
import { UserSchema, type IUser } from '../../../domain/user.entity';
import { type IAccount } from '../../../domain/account.entity';

export class MikroOrmUserRepository implements UserRepository {
  constructor(private readonly em: EntityManager) {}

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.em.count(UserSchema, { email });
    return count > 0;
  }

  async save(user: IUser, account: IAccount): Promise<void> {
    // persist obie encje, flush zapisuje je w jednej transakcji
    this.em.persist(user).persist(account);
    await this.em.flush();
  }
}
