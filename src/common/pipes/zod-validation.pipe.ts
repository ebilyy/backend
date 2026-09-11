import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodType } from 'zod';

/**
 * Проганяє вхідні дані через zod-схему: повертає розпарсене значення
 * (зайві поля zod зрізає сам) або 400 з переліком полів, що не пройшли.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || metadata.type,
          message: issue.message,
        })),
      });
    }

    return result.data;
  }
}
