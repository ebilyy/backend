import { Transform } from 'class-transformer';

// Не-рядки пропускаємо як є: .trim() на числі кинув би TypeError і клієнт
// отримав би 500 замість 400 — відхилити їх має @IsString/@IsEmail.

export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

export const ToLowerCase = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  );
