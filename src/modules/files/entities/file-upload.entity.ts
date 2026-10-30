import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/entity/abstract.entity';

@Entity('file_uploads')
export class FileUpload extends AbstractEntity {
  // text: ім'я й MIME-тип приходять від клієнта як є, і довге значення не
  // повинно валити запис у БД.
  @ApiProperty({ example: 'Прайс AFM.xlsx' })
  @Column({ name: 'original_name', type: 'text' })
  originalName: string;

  // Внутрішня адреса об'єкта в S3 назовні не віддається, тому за
  // замовчуванням і не читається з БД.
  @Column({ name: 'storage_key', length: 255, select: false })
  storageKey: string;

  @ApiProperty({ type: String, nullable: true, example: 'xlsx' })
  @Column({ name: 'extension', type: 'varchar', length: 10, nullable: true })
  extension: string | null;

  @ApiProperty({
    example:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  @Column({ name: 'mime_type', type: 'text' })
  mimeType: string;

  @ApiProperty({ example: 48213 })
  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes: number;

  // SHA-256 вмісту, hex. Унікальність на рівні БД, бо перевірка в сервісі не
  // рятує від гонки. Клієнту хеш ні до чого, тож за замовчуванням не читається.
  @Index({ unique: true })
  @Column({ name: 'content_hash', type: 'char', length: 64, select: false })
  contentHash: string;
}
