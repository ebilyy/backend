import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  // Docker healthcheck і зовнішній моніторинг дивляться сюди: процес, що
  // відповідає, але не бачить БД, не має вважатися здоровим.
  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException('База даних недоступна');
    }
    return { status: 'ok' };
  }
}
