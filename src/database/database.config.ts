import { DataSourceOptions } from 'typeorm';

type EnvReader = (key: string) => string | undefined;

const toBool = (value: string | undefined, fallback = false): boolean =>
  value === undefined
    ? fallback
    : ['1', 'true', 'yes'].includes(value.toLowerCase());

/**
 * Єдине джерело налаштувань БД — використовується і Nest-застосунком,
 * і TypeORM CLI (міграції), щоб вони не розʼїхались.
 */
export const buildDataSourceOptions = (get: EnvReader): DataSourceOptions => ({
  type: 'postgres',
  host: get('DB_HOST') ?? 'localhost',
  port: Number(get('POSTGRES_PORT') ?? 5444),
  username: get('POSTGRES_USER') ?? 'schemka',
  password: get('POSTGRES_PASSWORD') ?? 'schemka',
  database: get('POSTGRES_DB') ?? 'schemka',
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
  // Схему міняємо тільки міграціями — synchronize мовчки дропає колонки.
  synchronize: toBool(get('DB_SYNCHRONIZE')),
  migrationsRun: toBool(get('DB_MIGRATIONS_RUN')),
  logging: toBool(get('DB_LOGGING')) ? 'all' : ['error', 'warn'],
  ssl: toBool(get('DB_SSL')) ? { rejectUnauthorized: false } : false,
});
