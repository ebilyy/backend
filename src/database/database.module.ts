import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDataSourceOptions((key) => config.get<string>(key)),
        // Сутності, зареєстровані через TypeOrmModule.forFeature(), підхоплюються самі.
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
