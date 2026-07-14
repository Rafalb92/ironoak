import { config as loadEnv } from 'dotenv';
loadEnv();

import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { ProductImageSchema } from './modules/catalog/entities/product-image.entity';
import { AccountSchema } from './modules/identity/domain/account.entity';
import { ProductVariantSchema } from './modules/catalog/entities/product-variant.entity';
import { ProductSchema } from './modules/catalog/entities/product.entity';
import { CategorySchema } from './modules/catalog/entities/category.entity';
import { UserSchema } from './modules/identity/domain/user.entity';
import { entities } from './entities.generated';

export default defineConfig({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,

  // na razie pusto — encje dołożymy przy pierwszym module (Catalog/Identity)

  entities,
  extensions: [Migrator, SeedManager],
  seeder: {
    path: 'dist/seeders',
    pathTs: 'src/seeders',
    defaultSeeder: 'DatabaseSeeder',
  },
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  discovery: {
    warnWhenNoEntities: false,
  },

  // pokazuje SQL w konsoli — bezcenne na nauce, zobaczysz co ORM faktycznie robi
  debug: true,
});
