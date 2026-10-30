import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import { FileUploadsRepository } from '../repositories/file-uploads.repository';
import { FilesStorageService } from '../storage/files-storage.service';
import { FilesService } from './files.service';

const file = (originalname: string, content = 'abc') =>
  ({
    originalname,
    mimetype: 'text/csv',
    buffer: Buffer.from(content),
    size: Buffer.byteLength(content),
  }) as Express.Multer.File;

const sha256 = (content: string) =>
  createHash('sha256').update(content).digest('hex');

describe('FilesService', () => {
  let service: FilesService;
  let repository: {
    findByContentHashes: jest.Mock<Promise<object[]>, [string[], boolean]>;
    createFileUploads: jest.Mock<Promise<object[]>, [object[]]>;
    findManyByIds: jest.Mock<Promise<object[]>, [number[]]>;
  };
  let storage: {
    put: jest.Mock<Promise<void>, [string, Buffer, string]>;
    delete: jest.Mock<Promise<void>, [string]>;
  };

  const putKeys = () => storage.put.mock.calls.map(([key]) => key);
  const deletedKeys = () => storage.delete.mock.calls.map(([key]) => key);

  beforeEach(async () => {
    repository = {
      findByContentHashes: jest.fn<Promise<object[]>, [string[], boolean]>(() =>
        Promise.resolve([]),
      ),
      createFileUploads: jest.fn((rows: object[]) =>
        Promise.resolve(rows.map((row, i) => ({ ...row, id: i + 1 }))),
      ),
      findManyByIds: jest.fn<Promise<object[]>, [number[]]>(() =>
        Promise.resolve([]),
      ),
    };
    storage = {
      put: jest.fn<Promise<void>, [string, Buffer, string]>(() =>
        Promise.resolve(),
      ),
      delete: jest.fn<Promise<void>, [string]>(() => Promise.resolve()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: FileUploadsRepository, useValue: repository },
        { provide: FilesStorageService, useValue: storage },
      ],
    }).compile();

    service = module.get(FilesService);
  });

  it('rejects a request without files', async () => {
    await expect(service.upload([])).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.upload(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('stores the bytes, then the rows, and returns the re-read rows', async () => {
    await service.upload([file('Прайс AFM.XLSX')]);

    const [key] = putKeys();
    expect(key).toMatch(/^uploads\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.xlsx$/);
    expect(repository.createFileUploads).toHaveBeenCalledWith([
      {
        originalName: 'Прайс AFM.XLSX',
        storageKey: key,
        extension: 'xlsx',
        mimeType: 'text/csv',
        sizeBytes: 3,
        contentHash: sha256('abc'),
      },
    ]);
    expect(repository.findManyByIds).toHaveBeenCalledWith([1]);
  });

  it('looks up each distinct hash once, deleted rows included', async () => {
    await service.upload([file('a.csv', 'a'), file('b.csv', 'b')]);

    expect(repository.findByContentHashes).toHaveBeenCalledWith(
      [sha256('a'), sha256('b')],
      true,
    );
  });

  it('rejects the whole batch when one file is already uploaded', async () => {
    repository.findByContentHashes.mockResolvedValue([
      {
        id: 7,
        originalName: 'Прайс.xlsx',
        contentHash: sha256('b'),
        deletedAt: null,
      },
    ]);

    const upload = service.upload([file('a.csv', 'a'), file('b.csv', 'b')]);

    await expect(upload).rejects.toBeInstanceOf(ConflictException);
    await expect(upload).rejects.toMatchObject({
      response: {
        message: ['Файл «b.csv» вже завантажено як «Прайс.xlsx» (id 7)'],
      },
    });
    expect(storage.put).not.toHaveBeenCalled();
    expect(repository.createFileUploads).not.toHaveBeenCalled();
  });

  it('names a deleted file that holds the same content', async () => {
    repository.findByContentHashes.mockResolvedValue([
      {
        id: 3,
        originalName: 'old.csv',
        contentHash: sha256('abc'),
        deletedAt: new Date(),
      },
    ]);

    await expect(service.upload([file('a.csv')])).rejects.toMatchObject({
      response: {
        message: [
          'Файл «a.csv» збігається з видаленим файлом «old.csv» (id 3)',
        ],
      },
    });
  });

  it('rejects identical files within one batch', async () => {
    const upload = service.upload([
      file('a.csv'),
      file('b.csv', 'other'),
      file('c.csv'),
    ]);

    await expect(upload).rejects.toMatchObject({
      response: { message: ['Файл «c.csv» повторює «a.csv» у цьому ж запиті'] },
    });
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('keeps an unsafe extension out of the storage key', async () => {
    await service.upload([file('звіт.пдф')]);

    expect(putKeys()[0]).toMatch(/\/[0-9a-f-]{36}$/);
    expect(repository.createFileUploads).toHaveBeenCalledWith([
      expect.objectContaining({ extension: null }),
    ]);
  });

  it('removes every object and saves no rows when one object fails', async () => {
    storage.put
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('S3 down'));

    await expect(
      service.upload([file('a.csv', 'a'), file('b.csv', 'b')]),
    ).rejects.toThrow('S3 down');

    expect(repository.createFileUploads).not.toHaveBeenCalled();
    expect(deletedKeys()).toEqual(putKeys());
  });

  it('removes every object when the rows fail to save', async () => {
    repository.createFileUploads.mockRejectedValue(new Error('DB down'));

    await expect(
      service.upload([file('a.csv', 'a'), file('b.csv', 'b')]),
    ).rejects.toThrow('DB down');

    expect(deletedKeys()).toEqual(putKeys());
  });

  it('keeps the objects when only the re-read fails', async () => {
    repository.findManyByIds.mockRejectedValue(new Error('DB blip'));

    await expect(service.upload([file('a.csv')])).rejects.toThrow('DB blip');

    expect(storage.delete).not.toHaveBeenCalled();
  });
});
