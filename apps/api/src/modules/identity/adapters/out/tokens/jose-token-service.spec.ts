import { JoseTokenService } from './jose-token-service';

describe('JoseTokenService', () => {
  const service = new JoseTokenService({
    accessSecret: new TextEncoder().encode('test-access-secret'),
    refreshSecret: new TextEncoder().encode('test-refresh-secret'),
    accessTtl: '15m',
    refreshTtl: '7d',
  });

  it('wydaje i weryfikuje access token', async () => {
    const token = await service.issueAccessToken({ userId: 'user-123' });
    const payload = await service.verifyAccessToken(token);
    expect(payload.userId).toBe('user-123');
  });

  it('nie weryfikuje access tokena sekretem refresh', async () => {
    const token = await service.issueAccessToken({ userId: 'user-123' });
    await expect(service.verifyRefreshToken(token)).rejects.toThrow();
  });
});
