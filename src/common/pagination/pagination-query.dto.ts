import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

/**
 * Query-параметри для будь-якої колекції. @Type(() => Number) — бо з рядка
 * запиту числа приходять рядками; Max на limit — щоб клієнт не витягнув
 * таблицю цілком одним запитом. Дефолти тримаються, бо class-transformer
 * створює екземпляр через new і перезаписує лише передані поля.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    default: DEFAULT_PAGE,
    description: 'Номер сторінки, від 1',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: MAX_LIMIT,
    default: DEFAULT_LIMIT,
    description: `Записів на сторінці, максимум ${MAX_LIMIT}`,
    example: DEFAULT_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit: number = DEFAULT_LIMIT;
}

/** page/limit → skip/take для TypeORM. */
export function toSkipTake({ page, limit }: PaginationQueryDto) {
  return { skip: (page - 1) * limit, take: limit };
}
