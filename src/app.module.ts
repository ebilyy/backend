import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppValidationPipe } from './common/pipes';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthModule } from './infrastructure/health/health.module';
import { FilesModule, SuppliersModule } from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    FilesModule,
    SuppliersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Через APP_PIPE, а не app.useGlobalPipes у main.ts: так валідація діє
    // і в e2e-тестах, що піднімають застосунок з AppModule в обхід bootstrap().
    { provide: APP_PIPE, useClass: AppValidationPipe },
  ],
})
export class AppModule {}
