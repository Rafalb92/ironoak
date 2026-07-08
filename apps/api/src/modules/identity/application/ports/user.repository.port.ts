import { IUser } from '../../domain/user.entity';
import { IAccount } from '../../domain/account.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  existsByEmail(email: string): Promise<boolean>;
  save(user: IUser, account: IAccount): Promise<void>;
}
