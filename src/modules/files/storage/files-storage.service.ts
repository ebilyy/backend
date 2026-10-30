import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Readable } from 'node:stream';
import { STORAGE_OPTIONS, type StorageOptions } from './storage.config';

/**
 * Байти файлів у S3. Оперує лише ключами об'єктів: які ключі давати і що
 * записувати в БД, вирішують сервіси модуля.
 */
@Injectable()
export class FilesStorageService implements OnModuleDestroy {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(@Inject(STORAGE_OPTIONS) options: StorageOptions) {
    this.client = new S3Client(options.client);
    this.bucket = options.bucket;
  }

  // Upload, а не PutObjectCommand: тому потрібна довжина тіла наперед, а файл
  // з multipart-запиту приходить потоком без неї. Об'єкт з'являється під ключем
  // лише після успішного завершення, а збій прибирає вже завантажені частини.
  async put(
    key: string,
    body: Readable | Buffer,
    contentType?: string,
  ): Promise<void> {
    await new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    }).done();
  }

  async get(key: string): Promise<Readable> {
    const { Body } = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    // Тип тіла в SDK спільний для браузера й Node; у Node це завжди Readable.
    return Body as Readable;
  }

  // Відсутній ключ S3 видаляє без помилки, тож повторне видалення безпечне.
  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /** Кидає, якщо сховище недоступне або бакета немає. */
  async ping(): Promise<void> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}
