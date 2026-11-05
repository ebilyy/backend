import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/entity/abstract.entity';
import { IMPORT_FIELD_KEYS, type ImportFieldKey } from '../import-fields';
import { Supplier } from './supplier.entity';

export const SUPPLIER_CONFIG_CURRENCIES = ['UAH', 'USD'] as const;
export type SupplierConfigCurrency =
  (typeof SUPPLIER_CONFIG_CURRENCIES)[number];

/**
 * Одне зіставлення «колонка файлу → поле імпорту». Не сутність, а елемент
 * jsonb-масиву: клас потрібен лише для типу й Swagger-схеми.
 */
export class SupplierConfigColumn {
  @ApiProperty({ enum: IMPORT_FIELD_KEYS, example: 'price' })
  field: ImportFieldKey;

  @ApiProperty({ description: 'Літера колонки в аркуші', example: 'D' })
  column: string;

  // Текст заголовка на момент налаштування. За ним preflight помітить, що
  // постачальник пересунув колонки, замість мовчки читати ціну з кількості.
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Текст клітинки в рядку заголовків; null — заголовка немає',
    example: 'Ціна (usd)',
  })
  headerText: string | null;
}

@Entity('supplier_configs')
export class SupplierConfig extends AbstractEntity {
  @ApiProperty({ example: 'Основний прайс' })
  @Column({ name: 'name', length: 255 })
  name: string;

  @ApiProperty({ example: 1 })
  @Index()
  @Column({ name: 'supplier_id', type: 'integer' })
  supplierId: number;

  // Постачальники видаляються м'яко, тож каскад на рівні БД ніколи не
  // спрацює; RESTRICT лише не дасть стерти рядок постачальника руками.
  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Назва аркуша; null — перший аркуш книги',
    example: 'Sheet1',
  })
  @Column({ name: 'sheet_name', type: 'varchar', length: 255, nullable: true })
  sheetName: string | null;

  @ApiProperty({
    minimum: 1,
    description: 'Номер рядка заголовків, з 1; дані йдуть нижче',
    example: 4,
  })
  @Column({ name: 'header_row', type: 'integer' })
  headerRow: number;

  // varchar, а не enum Postgres: нова валюта тоді не вимагає ALTER TYPE.
  @ApiProperty({ enum: SUPPLIER_CONFIG_CURRENCIES, example: 'UAH' })
  @Column({ name: 'currency', type: 'varchar', length: 3 })
  currency: SupplierConfigCurrency;

  // jsonb, бо зіставлення завжди читається й пишеться цілком, а згодом
  // обросте правилами наявності, яким окремі колонки не потрібні.
  @ApiProperty({ type: () => [SupplierConfigColumn] })
  @Column({ name: 'columns', type: 'jsonb', default: () => "'[]'" })
  columns: SupplierConfigColumn[];
}
