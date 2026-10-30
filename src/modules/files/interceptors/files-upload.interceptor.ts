import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { Observable } from 'rxjs';
import { fieldErrorsException } from '../../../common/pipes';
import {
  FILES_FIELD,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_FILES_PER_REQUEST,
} from '../files.constants';

/**
 * Розбирає multipart-поле `files` у req.files. Свій замість FilesInterceptor
 * з @nestjs/platform-express, бо той віддає помилки multer англійською і
 * губить їхній код, а без коду не відрізнити, який саме ліміт спрацював.
 */
@Injectable()
export class FilesUploadInterceptor implements NestInterceptor {
  private readonly upload = multer({
    storage: multer.memoryStorage(),
    // Без цього multer читає filename як latin1 і кирилиця в іменах ламається.
    defParamCharset: 'utf8',
    // Ліміт обриває читання на 10 МБ, а не перевіряє розмір уже прочитаного.
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES_PER_REQUEST },
  }).array(FILES_FIELD);

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const http = context.switchToHttp();

    await new Promise<void>((resolve, reject) =>
      this.upload(
        http.getRequest<Request>(),
        http.getResponse<Response>(),
        (error: unknown) =>
          error ? reject(toHttpException(error)) : resolve(),
      ),
    );

    return next.handle();
  }
}

// multer 2.5 кладе ім'я файлу в помилку, але @types/multer про нього не знає.
type MulterFileError = MulterError & { filename?: string };

function toHttpException(error: unknown): HttpException {
  if (!(error instanceof MulterError)) {
    // Решту кидає busboy: зламаний або обірваний multipart.
    return new BadRequestException('Некоректний multipart/form-data запит');
  }

  switch (error.code) {
    case 'LIMIT_FILE_SIZE': {
      const { filename } = error as MulterFileError;
      return new PayloadTooLargeException(
        `Файл${filename ? ` «${filename}»` : ''} більший за ${MAX_FILE_SIZE_MB} МБ`,
      );
    }
    case 'LIMIT_FILE_COUNT':
      return fieldErrorsException([
        {
          field: FILES_FIELD,
          message: `Не більше ${MAX_FILES_PER_REQUEST} файлів за один запит`,
        },
      ]);
    case 'LIMIT_UNEXPECTED_FILE':
      return fieldErrorsException([
        {
          field: error.field ?? FILES_FIELD,
          message: `Файли приймаються лише в полі ${FILES_FIELD}`,
        },
      ]);
    default:
      return fieldErrorsException([
        { field: error.field ?? FILES_FIELD, message: error.message },
      ]);
  }
}
