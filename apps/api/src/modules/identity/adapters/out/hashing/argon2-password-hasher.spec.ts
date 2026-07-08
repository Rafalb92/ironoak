import { Argon2PasswordHasher } from './argon2-password-hasher';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher(Buffer.from('test-pepper'));

  it('hashuje i weryfikuje poprawne hasło', async () => {
    const h = await hasher.hash('correct horse battery staple');
    expect(h).toMatch(/^\$argon2id\$/);
    expect(await hasher.verify(h, 'correct horse battery staple')).toBe(true);
  });

  it('odrzuca błędne hasło', async () => {
    const h = await hasher.hash('correct horse battery staple');
    expect(await hasher.verify(h, 'złe-hasło')).toBe(false);
  });

  it('nie weryfikuje przy innym pepperze', async () => {
    const inny = new Argon2PasswordHasher(Buffer.from('inny-pepper'));
    const h = await hasher.hash('sekret');
    expect(await inny.verify(h, 'sekret')).toBe(false);
  });
});
