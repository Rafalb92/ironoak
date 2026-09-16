import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { UserSchema } from '../../domain/user.entity';
import {
  REFRESH_TOKEN_STORE,
  type RefreshTokenStore,
} from '../ports/refresh-token-store.port';

export interface CustomerInfo {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class CustomerQueryService {
  constructor(
    private readonly em: EntityManager,
    @Inject(REFRESH_TOKEN_STORE)
    private readonly refreshTokenStore: RefreshTokenStore,
  ) {}

  async changeRole(params: {
    targetUserId: string;
    newRole: 'USER' | 'ADMIN';
    actingAdminId: string;
  }): Promise<void> {
    // admin nie degraduje sam siebie — inaczej traci dostęp do panelu
    if (params.targetUserId === params.actingAdminId) {
      throw new ConflictException('You cannot change your own role');
    }

    const user = await this.em.findOne(UserSchema, { id: params.targetUserId });
    if (!user) throw new NotFoundException('User not found');

    // nie zostawiaj systemu bez administratora
    if (user.role === 'ADMIN' && params.newRole === 'USER') {
      const adminCount = await this.em.count(UserSchema, { role: 'ADMIN' });
      if (adminCount <= 1) {
        throw new ConflictException('Cannot demote the last administrator');
      }
    }

    user.role = params.newRole;
    await this.em.flush();

    // stary token niesie nieaktualną rolę — wymuś ponowne logowanie
    await this.refreshTokenStore.removeAllForUser(params.targetUserId);
  }

  async findByIds(userIds: string[]): Promise<CustomerInfo[]> {
    if (userIds.length === 0) return [];
    const users = await this.em.find(UserSchema, { id: { $in: userIds } });
    return users.map((u) => ({ userId: u.id, email: u.email, role: u.role }));
  }

  // zwraca id klientów pasujących do frazy — do wyszukiwania w Ordering
  async findIdsByEmail(fragment: string): Promise<string[]> {
    const users = await this.em.find(
      UserSchema,
      { email: { $ilike: `%${fragment}%` } },
      { fields: ['id'], limit: 100 },
    );
    return users.map((u) => u.id);
  }

  async list(params: { search?: string; page: number; limit: number }) {
    const where = params.search
      ? { email: { $ilike: `%${params.search}%` } }
      : {};

    const [users, total] = await this.em.findAndCount(UserSchema, where, {
      orderBy: { createdAt: 'desc' },
      limit: params.limit,
      offset: (params.page - 1) * params.limit,
    });

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  }
}
