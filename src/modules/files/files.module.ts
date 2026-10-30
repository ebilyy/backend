import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './controllers/files.controller';
import { FileUpload } from './entities/file-upload.entity';
import { FileUploadsRepository } from './repositories/file-uploads.repository';
import { FilesService } from './services/files.service';
import { FilesStorageService } from './storage/files-storage.service';
import { buildStorageOptions, STORAGE_OPTIONS } from './storage/storage.config';

@Module({
  imports: [TypeOrmModule.forFeature([FileUpload])],
  controllers: [FilesController],
  providers: [
    // Конфіг читається тут, а не в сервісі: @nestjs/config — чистий ESM, і
    // Jest без --experimental-vm-modules не завантажив би spec-и, що тягнуть сервіс.
    {
      provide: STORAGE_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildStorageOptions((key) => config.get<string>(key)),
    },
    FilesStorageService,
    FileUploadsRepository,
    FilesService,
  ],
  exports: [FilesStorageService],
})
export class FilesModule {}
