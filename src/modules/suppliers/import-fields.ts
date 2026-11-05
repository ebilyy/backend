import { ApiProperty } from '@nestjs/swagger';

/**
 * Закритий реєстр полів, на які можна зіставити колонку файлу постачальника.
 * Це не колонки БД: кожне поле згодом отримає власний нормалізатор (ціна з
 * комою, коди з провідними нулями), а схема БД може мінятись без поломки
 * збережених конфігів.
 */
export const IMPORT_FIELDS = [
  {
    key: 'code',
    label: 'Код товару',
    required: true,
    description:
      'Артикул постачальника; за ним товар впізнається між імпортами',
  },
  {
    key: 'name',
    label: 'Назва',
    required: true,
    description: 'Назва товару так, як її пише постачальник',
  },
  {
    key: 'price',
    label: 'Ціна',
    required: true,
    description: 'Вхідна ціна у валюті конфігу',
  },
  {
    key: 'retailPrice',
    label: 'РРЦ',
    required: false,
    description: 'Рекомендована роздрібна ціна від постачальника',
  },
  {
    key: 'availability',
    label: 'Наявність',
    required: false,
    description: 'Текстова ознака: «є», «+», «немає», «під замовлення»',
  },
  {
    key: 'quantity',
    label: 'Кількість',
    required: false,
    description: 'Залишок на складі постачальника',
  },
  {
    key: 'barcode',
    label: 'Штрихкод',
    required: false,
    description: 'EAN / UPC; допомагає зіставляти товари з конкурентами',
  },
  {
    key: 'brand',
    label: 'Бренд',
    required: false,
    description: 'Виробник або торгова марка',
  },
  {
    key: 'category',
    label: 'Категорія',
    required: false,
    description: 'Категорія або розділ у прайсі постачальника',
  },
  {
    key: 'description',
    label: 'Опис',
    required: false,
    description: 'Опис або характеристики товару',
  },
  {
    key: 'imageUrl',
    label: 'Фото (URL)',
    required: false,
    description: 'Посилання на зображення товару',
  },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]['key'];

export const IMPORT_FIELD_KEYS = IMPORT_FIELDS.map((field) => field.key);

export const REQUIRED_IMPORT_FIELD_KEYS = IMPORT_FIELDS.filter(
  (field) => field.required,
).map((field) => field.key);

/** Swagger-модель елемента реєстру: сам реєстр — `as const`, а не клас. */
export class ImportField {
  @ApiProperty({ enum: IMPORT_FIELD_KEYS, example: 'price' })
  key: ImportFieldKey;

  @ApiProperty({ example: 'Ціна' })
  label: string;

  @ApiProperty({
    description: 'Конфіг без цього поля не можна використати для імпорту',
  })
  required: boolean;

  @ApiProperty({ example: 'Вхідна ціна у валюті конфігу' })
  description: string;
}
