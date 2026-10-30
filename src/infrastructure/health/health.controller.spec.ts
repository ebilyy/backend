import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { FilesStorageService } from '../../modules/files/storage/files-storage.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const dataSource = { query: jest.fn() };
  const storage = { ping: jest.fn() };

  beforeEach(async () => {
    dataSource.query.mockReset().mockResolvedValue([{ '?column?': 1 }]);
    storage.ping.mockReset().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: dataSource },
        { provide: FilesStorageService, useValue: storage },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns ok when the database and the storage answer', async () => {
    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
  });

  it('returns 503 when the database is unreachable', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns 503 when the storage is unreachable', async () => {
    storage.ping.mockRejectedValue(new Error('connect ECONNREFUSED'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
