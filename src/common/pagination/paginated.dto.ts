import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';
import { DEFAULT_LIMIT } from './pagination-query.dto';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Усього записів, що підходять під запит',
    example: 0,
  })
  totalItems: number;

  @ApiProperty({ description: 'Скільки записів у цій відповіді', example: 0 })
  itemCount: number;

  @ApiProperty({ description: 'Розмір сторінки', example: DEFAULT_LIMIT })
  itemsPerPage: number;

  @ApiProperty({ description: 'Усього сторінок', example: 0 })
  totalPages: number;

  @ApiProperty({ description: 'Поточна сторінка', example: 1 })
  currentPage: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMetaDto;
}

/**
 * @ApiOkResponse для пагінованої колекції. Окремий клас на кожну сутність
 * не описати — дженерики в рантаймі стираються, тож схему збираємо руками
 * з $ref на модель.
 */
export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
  description?: string,
) =>
  applyDecorators(
    ApiExtraModels(PaginationMetaDto, model),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        required: ['items', 'meta'],
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(PaginationMetaDto) },
        },
      },
    }),
  );
