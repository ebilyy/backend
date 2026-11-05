import { ValidateBy, ValidationArguments } from 'class-validator';
import { REQUIRED_IMPORT_FIELD_KEYS } from '../import-fields';

// Елементи масиву ще не провалідовані: тут може бути null, число чи об'єкт
// без потрібних ключів. Їх відхилить @ValidateNested, а ці правила мають
// лише не впасти на них.
type ColumnLike = Partial<Record<'field' | 'column', unknown>> | null;

function duplicates(values: unknown[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string') continue;
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }

  return [...repeated];
}

function missingRequired(columns: ColumnLike[]): string[] {
  const mapped = new Set(columns.map((column) => column?.field));

  return REQUIRED_IMPORT_FIELD_KEYS.filter((key) => !mapped.has(key));
}

function columnsRule(
  name: string,
  problems: (columns: ColumnLike[]) => string[],
  message: (list: string) => string,
) {
  return ValidateBy({
    name,
    validator: {
      // Не масив — це вже помилка @IsArray, другу на те саме не додаємо.
      validate: (value: unknown) =>
        !Array.isArray(value) || problems(value as ColumnLike[]).length === 0,
      defaultMessage: ({ value }: ValidationArguments) =>
        message(problems(value as ColumnLike[]).join(', ')),
    },
  });
}

/** Інакше незрозуміло, з якої з двох колонок брати, наприклад, ціну. */
export const EachFieldOnce = () =>
  columnsRule(
    'eachFieldOnce',
    (columns) => duplicates(columns.map((column) => column?.field)),
    (list) => `Поле зіставлене з кількома колонками: ${list}`,
  );

/** Одна колонка з двома полями — майже завжди помилка в налаштуванні. */
export const EachColumnOnce = () =>
  columnsRule(
    'eachColumnOnce',
    (columns) => duplicates(columns.map((column) => column?.column)),
    (list) => `Колонка зіставлена з кількома полями: ${list}`,
  );

/** Перевірка під час збереження, тож кожен конфіг у БД придатний до імпорту. */
export const HasRequiredFields = () =>
  columnsRule(
    'hasRequiredFields',
    missingRequired,
    (list) => `Не зіставлено обов'язкові поля: ${list}`,
  );
