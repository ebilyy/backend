import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.config';

// CLI живе поза Nest DI, тож .env треба підняти вручну.
loadEnv();

export const dataSourceOptions = buildDataSourceOptions(
  (key) => process.env[key],
);

export default new DataSource(dataSourceOptions);
