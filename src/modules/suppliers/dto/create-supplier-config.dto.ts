import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ToUpperCase, Trim } from '../../../common/decorators';
import {
  SUPPLIER_CONFIG_CURRENCIES,
  type SupplierConfigCurrency,
} from '../entities/supplier-config.entity';
import { IMPORT_FIELD_KEYS, type ImportFieldKey } from '../import-fields';
import {
  EachColumnOnce,
  EachFieldOnce,
  HasRequiredFields,
} from './supplier-config-columns.validators';

// Останній рядок аркуша xlsx: вище заголовків бути не може.
const MAX_SHEET_ROW = 1_048_576;

export class SupplierConfigColumnDto {
  @ApiProperty({ enum: IMPORT_FIELD_KEYS, example: 'price' })
  @IsIn(IMPORT_FIELD_KEYS)
  field: ImportFieldKey;

  @ApiProperty({
    pattern: '^[A-Z]{1,3}$',
    description: 'Літера колонки в аркуші, зводиться до верхнього регістру',
    example: 'D',
  })
  @Trim()
  @ToUpperCase()
  @Matches(/^[A-Z]{1,3}$/, {
    message: 'column має бути літерою колонки: A, D, AB',
  })
  column: string;

  // Ініціалізатор, бо без ключа JSON.stringify викинув би поле з jsonb, і
  // при читанні замість null прийшов би undefined.
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 255,
    description:
      'Текст клітинки в рядку заголовків; null або відсутнє — заголовка немає',
    example: 'Ціна (usd)',
  })
  @Trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  headerText: string | null = null;
}

// Без ініціалізаторів полів: PartialType переносить їх в UpdateDto, і PATCH
// без sheetName мовчки скидав би аркуш на перший.
export class CreateSupplierConfigDto {
  @ApiProperty({ minLength: 1, maxLength: 255, example: 'Основний прайс' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 255,
    description: 'Назва аркуша; null або відсутнє — перший аркуш книги',
    example: 'Sheet1',
  })
  @Trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sheetName?: string | null;

  @ApiProperty({
    minimum: 1,
    maximum: MAX_SHEET_ROW,
    description: 'Номер рядка заголовків, з 1; дані йдуть нижче',
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(MAX_SHEET_ROW)
  headerRow: number;

  @ApiProperty({ enum: SUPPLIER_CONFIG_CURRENCIES, example: 'UAH' })
  @IsIn(SUPPLIER_CONFIG_CURRENCIES)
  currency: SupplierConfigCurrency;

  @ApiProperty({
    type: () => [SupplierConfigColumnDto],
    description:
      'Зіставлення «колонка → поле». Обов’язкові поля реєстру (GET /import-fields) мають бути зіставлені; кожне поле й кожна колонка — не більше одного разу',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierConfigColumnDto)
  @EachFieldOnce()
  @EachColumnOnce()
  @HasRequiredFields()
  columns: SupplierConfigColumnDto[];
}
