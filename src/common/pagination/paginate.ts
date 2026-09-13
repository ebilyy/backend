import { Paginated } from './paginated.dto';
import { PaginationQueryDto } from './pagination-query.dto';

/** Загортає результат TypeORM findAndCount у { items, meta }. */
export function paginate<T>(
  [items, totalItems]: [T[], number],
  { page, limit }: PaginationQueryDto,
): Paginated<T> {
  return {
    items,
    meta: {
      totalItems,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    },
  };
}
