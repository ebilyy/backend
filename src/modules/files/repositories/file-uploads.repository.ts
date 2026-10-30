import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, In, Repository } from 'typeorm';
import { PaginationQueryDto, toSkipTake } from '../../../common/pagination';
import { FileUpload } from '../entities/file-upload.entity';

@Injectable()
export class FileUploadsRepository extends Repository<FileUpload> {
  constructor(dataSource: DataSource) {
    super(FileUpload, dataSource.createEntityManager());
  }

  // content_hash за замовчуванням не читається, а без нього знайдені рядки
  // не зіставити з файлами запиту.
  findByContentHashes(contentHashes: string[], includeDeleted = false) {
    return this.find({
      select: {
        id: true,
        originalName: true,
        contentHash: true,
        deletedAt: true,
      },
      where: { contentHash: In(contentHashes) },
      withDeleted: includeDeleted,
    });
  }

  findManyByIds(ids: number[]) {
    return this.find({ where: { id: In(ids) }, order: { id: 'ASC' } });
  }

  // Новіші перші. За id, а не created_at: файли одного запиту пишуться в одній
  // транзакції й отримують однаковий created_at, тож порядок між ними плавав би.
  findAllFileUploads(pagination: PaginationQueryDto) {
    return this.findAndCount({
      ...toSkipTake(pagination),
      order: { id: 'DESC' },
    });
  }

  // save масиву йде однією транзакцією: або всі рядки, або жодного.
  createFileUploads(uploadsData: DeepPartial<FileUpload>[]) {
    return this.save(this.create(uploadsData));
  }
}
