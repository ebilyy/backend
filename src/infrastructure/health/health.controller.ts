import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { FilesStorageService } from '../../modules/files/storage/files-storage.service';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storage: FilesStorageService,
  ) {}

  // Docker healthcheck і зовнішній моніторинг дивляться сюди: процес, що
  // відповідає, але не бачить БД чи сховища файлів, не має вважатися здоровим.
  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException('База даних недоступна');
    }
    try {
      await this.storage.ping();
    } catch {
      throw new ServiceUnavailableException('Сховище файлів недоступне');
    }
    return { status: 'ok' };
  }
}
