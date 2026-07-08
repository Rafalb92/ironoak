import { hash, verify, type Options } from '@node-rs/argon2';
import type { PasswordHasher } from '../../../application/ports/password-hasher.port';

const ARGON2ID = 2;

export class Argon2PasswordHasher implements PasswordHasher {
  private readonly options: Options;

  constructor(pepper: Buffer) {
    this.options = {
      algorithm: ARGON2ID, // hybryda, rekomendacja OWASP
      memoryCost: 19456, // 19 MiB
      timeCost: 2,
      parallelism: 1,
      secret: pepper, // <-- to jest pepper, zrobiony poprawnie
    };
  }

  hash(plain: string): Promise<string> {
    return hash(plain, this.options);
  }

  verify(hashed: string, plain: string): Promise<boolean> {
    return verify(hashed, plain, this.options);
  }
}
