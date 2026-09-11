import { ApiBody } from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger';
import { z, ZodType } from 'zod';

/**
 * Перетворює zod-схему на OpenAPI-схему, щоб документація бралася з тієї
 * самої схеми, якою валідується запит, і не роз'їжджалася з нею.
 *
 * io: 'input' — описуємо те, що клієнт надсилає, а не результат після
 * трансформацій; unrepresentable: 'any' — .trim()/.toLowerCase() та .refine()
 * не мають відповідника в JSON Schema, тож їх просто пропускаємо замість
 * падіння. Те, що через це губиться (наприклад format: 'email'), доганяємо
 * через .meta() у самій схемі.
 */
export function zodToOpenApi(schema: ZodType): SchemaObject {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
    unrepresentable: 'any',
  }) as SchemaObject;
}

/** @ApiBody, але тіло описується zod-схемою, а не окремим класом. */
export function ApiZodBody(schema: ZodType, description?: string) {
  return ApiBody({ description, schema: zodToOpenApi(schema) });
}
