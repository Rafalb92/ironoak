import { config as loadEnv } from 'dotenv';
loadEnv();

import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

export default defineConfig({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,

  // na razie pusto — encje dołożymy przy pierwszym module (Catalog/Identity)
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],

  extensions: [Migrator],
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
