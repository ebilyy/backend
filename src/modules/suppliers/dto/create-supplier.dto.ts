import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .meta({ description: 'Назва постачальника', example: 'ТОВ «Ромашка»' }),
  // trim/lowercase до перевірки формату: z.email() інакше побачить сирий рядок
  // із пробілами. Нижній регістр — щоб унікальний індекс не пропускав
  // A@b.com поруч з a@b.com.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email().max(255))
    // format/maxLength — руками, бо в OpenAPI описуємо вхід, а обмеження
    // висять на виході pipe() і туди не потрапляють.
    .meta({
      description: 'Унікальний email, зводиться до нижнього регістру',
      format: 'email',
      maxLength: 255,
      example: 'sales@romashka.ua',
    }),
  description: z
    .string()
    .trim()
    .nullish()
    .meta({ description: 'Довільний опис', example: 'Постачає канцелярію' }),
});

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
