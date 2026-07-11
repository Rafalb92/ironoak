import Redis from 'ioredis';
import type { RefreshTokenStore } from '../../../application/ports/refresh-token-store.port';

export class RedisRefreshTokenStore implements RefreshTokenStore {
  constructor(private readonly redis: Redis) {}

  private key(userId: string, jti: string): string {
    return `refresh:${userId}:${jti}`;
  }

  async save(userId: string, jti: string, ttlSeconds: number): Promise<void> {
    // 'EX' = wygaśnięcie w sekundach; Redis sam usunie klucz po ttl
    await this.redis.set(this.key(userId, jti), '1', 'EX', ttlSeconds);
  }

  async exists(userId: string, jti: string): Promise<boolean> {
    const result = await this.redis.exists(this.key(userId, jti));
    return result === 1;
  }

  async remove(userId: string, jti: string): Promise<void> {
    await this.redis.del(this.key(userId, jti));
  }

  async removeAllForUser(userId: string): Promise<void> {
    // znajdź wszystkie klucze usera i skasuj — o pułapce niżej
    const keys = await this.redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
