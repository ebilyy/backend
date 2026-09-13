import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger';
import { z, ZodObject, ZodType } from 'zod';

/**
 * Zod-схема → OpenAPI, щоб документація бралася з тієї самої схеми, якою
 * валідується запит. io: 'input' — описуємо те, що надсилає клієнт;
 * unrepresentable: 'any' — .trim()/.refine() не мають відповідника
 * в JSON Schema, тож їх просто пропускаємо. Решту доганяємо через .meta().
 */
export function zodToOpenApi(schema: ZodType): SchemaObject {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
    unrepresentable: 'any',
  }) as SchemaObject;
}

/** @ApiBody, але тіло описується zod-схемою, а не окремим класом. */
export function ApiZodBody(schema: ZodType) {
  return ApiBody({ schema: zodToOpenApi(schema) });
}

/** Query-параметри в OpenAPI живуть поштучно, тож розбираємо об'єкт на поля. */
export function ApiZodQuery(schema: ZodObject) {
  const { properties = {}, required = [] } = zodToOpenApi(schema);

  return applyDecorators(
    ...Object.entries(properties).map(([name, property]) =>
      ApiQuery({
        name,
        required: required.includes(name),
        schema: property as SchemaObject,
      }),
    ),
  );
}
