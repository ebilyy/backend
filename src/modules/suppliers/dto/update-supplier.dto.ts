import { z } from 'zod';
import { createSupplierSchema } from './create-supplier.dto';

// Порожній PATCH інакше був би «успішним», не змінивши нічого.
export const updateSupplierSchema = createSupplierSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Треба передати хоча б одне поле для оновлення',
  })
  .meta({ description: 'Хоча б одне поле обов’язкове' });

export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
