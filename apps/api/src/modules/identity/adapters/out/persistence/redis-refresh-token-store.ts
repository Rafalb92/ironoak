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
    const pattern = `refresh:${userId}:*`;
    const stream = this.redis.scanStream({ match: pattern, count: 100 });

    const pipeline = this.redis.pipeline();
    let found = 0;

    for await (const keys of stream) {
      if (keys.length > 0) {
        pipeline.del(...(keys as string[]));
        found += keys.length;
      }
    }

    if (found > 0) {
      await pipeline.exec();
    }
  }
}
