import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Response } from 'express';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

type Check = 'up' | 'down';

/**
 * Liveness for the hosting platform. "up" only when the process can actually
 * serve requests: a running process without its database is not healthy.
 */
@ApiTags('system')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly em: EntityManager,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: '200 when Postgres and Redis respond, 503 otherwise.',
  })
  async check(@Res() res: Response) {
    const [database, redis] = await Promise.all([
      this.probe(() => this.em.fork().getConnection().execute('select 1')),
      this.probe(() => this.redis.ping()),
    ]);

    const healthy = database === 'up' && redis === 'up';
    res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: healthy ? 'ok' : 'degraded',
      checks: { database, redis },
    });
  }

  private async probe(check: () => Promise<unknown>): Promise<Check> {
    try {
      // a hung dependency must not hang the health check itself
      await Promise.race([
        check(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 2000),
        ),
      ]);
      return 'up';
    } catch {
      return 'down';
    }
  }
}
