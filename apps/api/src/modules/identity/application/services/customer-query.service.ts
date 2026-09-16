import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { UserSchema } from '../../domain/user.entity';

export interface CustomerInfo {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class CustomerQueryService {
  constructor(private readonly em: EntityManager) {}

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
