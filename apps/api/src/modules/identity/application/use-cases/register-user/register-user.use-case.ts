import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../ports/password-hasher.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../ports/user.repository.port';
import { UserSchema } from '../../../domain/user.entity';
import { AccountSchema } from '../../../domain/account.entity';
import { RegisterUserCommand } from './register-user.command';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly em: EntityManager,
  ) {}

  async execute(command: RegisterUserCommand): Promise<{ userId: string }> {
    // 1. reguła: e-mail musi być unikalny
    if (await this.users.existsByEmail(command.email)) {
      throw new ConflictException('Email already in use');
    }

    // 2. zahashuj hasło (port — nie wiemy, że to Argon2)
    const passwordHash = await this.hasher.hash(command.plainPassword);

    // 3. stwórz encje: user (tożsamość) + account (credential z hashem)
    const user = this.em.create(UserSchema, {
      email: command.email,
    });

    const account = this.em.create(AccountSchema, {
      user,
      providerId: 'credential',
      accountId: command.email,
      password: passwordHash,
    });

    // 4. zapisz oba jako całość (jedna transakcja)
    await this.users.save(user, account);

    // 5. oddaj id nowego usera
    return { userId: user.id };
  }
}
