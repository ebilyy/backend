import { ApiProperty } from '@nestjs/swagger';

/** Стандартна відповідь Nest-винятків (NotFound, Conflict тощо). */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Постачальника з id 42 не знайдено' })
  message: string;

  @ApiProperty({ example: 'Not Found' })
  error: string;
}

export class ValidationIssueDto {
  @ApiProperty({
    description: 'Поле, яке не пройшло перевірку',
    example: 'email',
  })
  field: string;

  @ApiProperty({ example: 'Invalid email address' })
  message: string;
}

/** Те, що віддає ZodValidationPipe: message — список полів із помилками. */
export class ValidationErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ type: [ValidationIssueDto] })
  message: ValidationIssueDto[];
}
