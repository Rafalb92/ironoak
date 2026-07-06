import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserSchema } from './domain/user.entity';
import { AccountSchema } from './domain/account.entity';

@Module({
  imports: [MikroOrmModule.forFeature([UserSchema, AccountSchema])],
})
export class IdentityModule {}
