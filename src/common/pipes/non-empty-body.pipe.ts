import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { fieldErrorsException } from './validation.pipe';

/**
 * Для PATCH: порожнє тіло інакше було б «успішним», не змінивши нічого.
 * Дивимось на значення, а не на ключі — екземпляр DTO може мати власні
 * поля зі значенням undefined (семантика class fields при target ES2022+).
 */
@Injectable()
export class NonEmptyBodyPipe<T extends object> implements PipeTransform<T, T> {
  transform(value: T, metadata: ArgumentMetadata): T {
    if (Object.values(value).some((field) => field !== undefined)) {
      return value;
    }

    throw fieldErrorsException([
      {
        field: metadata.type,
        message: 'Треба передати хоча б одне поле для оновлення',
      },
    ]);
  }
}
