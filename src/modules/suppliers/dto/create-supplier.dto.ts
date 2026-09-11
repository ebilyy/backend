import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1).max(255),
  // trim/lowercase до перевірки формату: z.email() інакше побачить сирий рядок
  // із пробілами. Нижній регістр — щоб унікальний індекс не пропускав
  // A@b.com поруч з a@b.com.
  email: z.string().trim().toLowerCase().pipe(z.email().max(255)),
  description: z.string().trim().nullish(),
});

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
