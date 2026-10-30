import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MAX_FILE_SIZE_BYTES, MAX_FILES_PER_REQUEST } from '../files.constants';
import { FilesService } from '../services/files.service';
import { FilesController } from './files.controller';

// Через HTTP, а не викликом методу: ліміти й декодування імен живуть у
// multer-інтерцепторі, який працює лише на справжньому multipart-запиті.
describe('FilesController', () => {
  let app: INestApplication<App>;
  let filesService: {
    upload: jest.Mock<Promise<unknown[]>, [Express.Multer.File[] | undefined]>;
  };

  const post = () => request(app.getHttpServer()).post('/files');

  beforeEach(async () => {
    filesService = {
      upload: jest.fn<Promise<unknown[]>, [Express.Multer.File[] | undefined]>(
        () => Promise.resolve([]),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: filesService }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('passes a file of exactly 10 MB to the service with its Cyrillic name intact', async () => {
    await post()
      .attach('files', Buffer.alloc(MAX_FILE_SIZE_BYTES), 'Прайс.xlsx')
      .expect(201);

    const [files] = filesService.upload.mock.calls[0];
    expect(files).toEqual([
      expect.objectContaining({
        originalname: 'Прайс.xlsx',
        size: MAX_FILE_SIZE_BYTES,
      }),
    ]);
  });

  it('rejects a file over 10 MB with 413', async () => {
    await post()
      .attach('files', Buffer.alloc(MAX_FILE_SIZE_BYTES + 1), 'big.xlsx')
      .expect(413, {
        statusCode: 413,
        message: 'Файл «big.xlsx» більший за 10 МБ',
        error: 'Payload Too Large',
      });

    expect(filesService.upload).not.toHaveBeenCalled();
  });

  it('rejects more files than allowed per request', async () => {
    let req = post();
    for (let i = 0; i <= MAX_FILES_PER_REQUEST; i++) {
      req = req.attach('files', Buffer.from('x'), `${i}.csv`);
    }

    await req.expect(400, {
      statusCode: 400,
      error: 'Bad Request',
      message: [
        {
          field: 'files',
          message: `Не більше ${MAX_FILES_PER_REQUEST} файлів за один запит`,
        },
      ],
    });
  });

  it('rejects a file sent under another field', async () => {
    await post()
      .attach('file', Buffer.from('x'), 'a.csv')
      .expect(400, {
        statusCode: 400,
        error: 'Bad Request',
        message: [
          { field: 'file', message: 'Файли приймаються лише в полі files' },
        ],
      });
  });
});
