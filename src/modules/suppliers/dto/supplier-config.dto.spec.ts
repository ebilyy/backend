import { BadRequestException } from '@nestjs/common';
import { AppValidationPipe, FieldError } from '../../../common/pipes';
import { CreateSupplierConfigDto } from './create-supplier-config.dto';
import { UpdateSupplierConfigDto } from './update-supplier-config.dto';

// Через справжній глобальний пайп: правила на columns залежать від того,
// що @Type і @ToUpperCase відпрацювали до валідації.
const pipe = new AppValidationPipe();

const validate = (metatype: new () => object, body: unknown) =>
  pipe.transform(body, { type: 'body', metatype });

async function fieldErrors(
  metatype: new () => object,
  body: unknown,
): Promise<FieldError[]> {
  try {
    await validate(metatype, body);
  } catch (error) {
    if (error instanceof BadRequestException) {
      return (error.getResponse() as { message: FieldError[] }).message;
    }
    throw error;
  }
  throw new Error('Очікували 400, а тіло пройшло валідацію');
}

const requiredColumns = [
  { field: 'code', column: 'B', headerText: 'Код' },
  { field: 'name', column: 'C', headerText: 'Найменування' },
  { field: 'price', column: 'D', headerText: 'Ціна (usd)' },
];

const validBody = {
  name: 'Основний прайс',
  sheetName: 'Sheet1',
  headerRow: 4,
  currency: 'USD',
  columns: requiredColumns,
};

describe('CreateSupplierConfigDto', () => {
  it('нормалізує колонку і підставляє null замість відсутнього заголовка', async () => {
    const dto = (await validate(CreateSupplierConfigDto, {
      ...validBody,
      columns: [...requiredColumns, { field: 'brand', column: ' ab ' }],
    })) as CreateSupplierConfigDto;

    expect(dto.columns[3]).toEqual({
      field: 'brand',
      column: 'AB',
      headerText: null,
    });
  });

  it('вимагає обов’язкові поля реєстру', async () => {
    const errors = await fieldErrors(CreateSupplierConfigDto, {
      ...validBody,
      columns: [requiredColumns[0]],
    });

    expect(errors).toContainEqual({
      field: 'columns',
      message: "Не зіставлено обов'язкові поля: name, price",
    });
  });

  it('не дає зіставити поле двічі', async () => {
    const errors = await fieldErrors(CreateSupplierConfigDto, {
      ...validBody,
      columns: [...requiredColumns, { field: 'price', column: 'E' }],
    });

    expect(errors).toContainEqual({
      field: 'columns',
      message: 'Поле зіставлене з кількома колонками: price',
    });
  });

  it('ловить дубль колонки незалежно від регістру', async () => {
    const errors = await fieldErrors(CreateSupplierConfigDto, {
      ...validBody,
      columns: [...requiredColumns, { field: 'brand', column: 'd' }],
    });

    expect(errors).toContainEqual({
      field: 'columns',
      message: 'Колонка зіставлена з кількома полями: D',
    });
  });

  it('відхиляє невідоме поле і криву колонку', async () => {
    const errors = await fieldErrors(CreateSupplierConfigDto, {
      ...validBody,
      columns: [...requiredColumns, { field: 'colour', column: 'D4' }],
    });

    expect(errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['columns.3.field', 'columns.3.column']),
    );
  });

  it('не падає на null усередині columns', async () => {
    const errors = await fieldErrors(CreateSupplierConfigDto, {
      ...validBody,
      columns: [...requiredColumns, null],
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateSupplierConfigDto', () => {
  it('дозволяє скинути аркуш на перший', async () => {
    await expect(
      validate(UpdateSupplierConfigDto, { sheetName: null }),
    ).resolves.toMatchObject({ sheetName: null });
  });

  it('не дає обнулити обов’язкове поле', async () => {
    const errors = await fieldErrors(UpdateSupplierConfigDto, {
      headerRow: null,
    });

    expect(errors.map((error) => error.field)).toContain('headerRow');
  });

  it('перевіряє columns цілком, бо масив замінюється', async () => {
    const errors = await fieldErrors(UpdateSupplierConfigDto, {
      columns: [requiredColumns[2]],
    });

    expect(errors).toContainEqual({
      field: 'columns',
      message: "Не зіставлено обов'язкові поля: code, name",
    });
  });
});
