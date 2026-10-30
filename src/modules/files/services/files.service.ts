import { ConflictException, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  paginate,
  Paginated,
  PaginationQueryDto,
} from '../../../common/pagination';
import { fieldErrorsException } from '../../../common/pipes';
import { FileUpload } from '../entities/file-upload.entity';
import { FILES_FIELD } from '../files.constants';
import { FileUploadsRepository } from '../repositories/file-uploads.repository';
import { FilesStorageService } from '../storage/files-storage.service';

// Розширення йде в ключ S3, тож пропускаємо лише латиницю й цифри.
const SAFE_EXTENSION = /^[a-z0-9]{1,10}$/;

@Injectable()
export class FilesService {
  constructor(
    private readonly fileUploadsRepository: FileUploadsRepository,
    private readonly storage: FilesStorageService,
  ) {}

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<Paginated<FileUpload>> {
    return paginate(
      await this.fileUploadsRepository.findAllFileUploads(pagination),
      pagination,
    );
  }

  async upload(files: Express.Multer.File[] = []): Promise<FileUpload[]> {
    if (files.length === 0) {
      throw fieldErrorsException([
        { field: FILES_FIELD, message: 'Треба передати хоча б один файл' },
      ]);
    }

    const uploadsData = files.map(toFileUploadData);
    await this.ensureNoDuplicates(uploadsData);
    const saved = await this.storeAll(files, uploadsData);

    // Перечитуємо, щоб у відповідь не потрапив storageKey.
    return this.fileUploadsRepository.findManyByIds(saved.map(({ id }) => id));
  }

  /**
   * Пакет із дублікатом відхиляється цілком, як і пакет, де не записався один
   * файл. Шукаємо й серед видалених, бо їхні рядки теж тримають унікальний
   * індекс. Гонку двох однакових запитів ловить сам індекс: save падає, і
   * storeAll прибирає вже записані об'єкти.
   */
  private async ensureNoDuplicates(uploadsData: FileUploadData[]) {
    const hashes = [
      ...new Set(uploadsData.map(({ contentHash }) => contentHash)),
    ];
    const existing = new Map(
      (await this.fileUploadsRepository.findByContentHashes(hashes, true)).map(
        (row) => [row.contentHash, row],
      ),
    );
    const firstInBatch = new Map<string, string>();
    const messages: string[] = [];

    for (const { originalName, contentHash } of uploadsData) {
      const row = existing.get(contentHash);
      const first = firstInBatch.get(contentHash);

      if (row) {
        messages.push(
          row.deletedAt
            ? `Файл «${originalName}» збігається з видаленим файлом «${row.originalName}» (id ${row.id})`
            : `Файл «${originalName}» вже завантажено як «${row.originalName}» (id ${row.id})`,
        );
      } else if (first !== undefined) {
        messages.push(
          `Файл «${originalName}» повторює «${first}» у цьому ж запиті`,
        );
      } else {
        firstInBatch.set(contentHash, originalName);
      }
    }

    if (messages.length > 0) {
      throw new ConflictException(messages);
    }
  }

  /**
   * Все або нічого: якщо не записався хоч один об'єкт чи рядок, прибираємо
   * вже записані об'єкти, щоб клієнт не гадав, які файли з пакета збереглися.
   */
  private async storeAll(
    files: Express.Multer.File[],
    uploadsData: FileUploadData[],
  ) {
    try {
      // allSettled, а не all: інакше прибирання почалося б, поки інші
      // завантаження ще йдуть, і їхні об'єкти з'явилися б уже після нього.
      const puts = await Promise.allSettled(
        files.map((file, i) =>
          this.storage.put(
            uploadsData[i].storageKey,
            file.buffer,
            file.mimetype,
          ),
        ),
      );
      const failed = puts.find(
        (put): put is PromiseRejectedResult => put.status === 'rejected',
      );
      if (failed) {
        throw failed.reason;
      }

      return await this.fileUploadsRepository.createFileUploads(uploadsData);
    } catch (error) {
      // Видалення відсутнього ключа в S3 — не помилка, тож чистимо всі ключі.
      await Promise.allSettled(
        uploadsData.map(({ storageKey }) => this.storage.delete(storageKey)),
      );
      throw error;
    }
  }
}

type FileUploadData = ReturnType<typeof toFileUploadData>;

function toFileUploadData(file: Express.Multer.File) {
  const rawExtension = extname(file.originalname).slice(1).toLowerCase();
  const extension = SAFE_EXTENSION.test(rawExtension) ? rawExtension : null;
  const day = new Date().toISOString().slice(0, 10);

  return {
    originalName: file.originalname,
    storageKey: `uploads/${day}/${randomUUID()}${extension ? `.${extension}` : ''}`,
    extension,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    contentHash: createHash('sha256').update(file.buffer).digest('hex'),
  };
}
