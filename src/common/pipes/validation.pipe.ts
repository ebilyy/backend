import {
  BadRequestException,
  Injectable,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export interface FieldError {
  field: string;
  message: string;
}

/** 400 з переліком полів, що не пройшли — спільний формат для всіх пайпів. */
export function fieldErrorsException(errors: FieldError[]) {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: errors,
  });
}

function flattenErrors(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap(({ property, constraints = {}, children = [] }) => {
    const field = parent ? `${parent}.${property}` : property;

    return [
      ...Object.values(constraints).map((message) => ({ field, message })),
      ...flattenErrors(children, field),
    ];
  });
}

/**
 * transform — у контролер приходить екземпляр DTO з уже застосованими
 * @Transform/@Type і дефолтами полів; whitelist — поля без декораторів
 * валідації зрізаються, щоб клієнт не протягнув у БД зайве.
 */
@Injectable()
export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) => fieldErrorsException(flattenErrors(errors)),
    });
  }
}
