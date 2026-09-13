import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

/**
 * Query-параметри для будь-якої колекції. coerce — бо з рядка запиту
 * числа приходять рядками; max на limit — щоб клієнт не витягнув таблицю
 * цілком одним запитом.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(DEFAULT_PAGE)
    .meta({ description: 'Номер сторінки, від 1', example: 1 }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_LIMIT)
    .default(DEFAULT_LIMIT)
    .meta({
      description: `Записів на сторінці, максимум ${MAX_LIMIT}`,
      example: DEFAULT_LIMIT,
    }),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;

/** page/limit → skip/take для TypeORM. */
export function toSkipTake({ page, limit }: PaginationQueryDto) {
  return { skip: (page - 1) * limit, take: limit };
}
