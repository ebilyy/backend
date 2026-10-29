import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ToLowerCase, Trim } from '../../../common/decorators';

export class CreateSupplierDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 255,
    description: 'Назва постачальника',
    example: 'ТОВ «Ромашка»',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  // @Transform відпрацьовує до валідації, тож @IsEmail бачить уже обрізаний
  // рядок. Нижній регістр — щоб унікальний індекс не пропускав A@b.com
  // поруч з a@b.com.
  @ApiProperty({
    format: 'email',
    maxLength: 255,
    description: 'Унікальний email, зводиться до нижнього регістру',
    example: 'sales@romashka.ua',
  })
  @Trim()
  @ToLowerCase()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Довільний опис',
    example: 'Постачає канцелярію',
  })
  @Trim()
  @IsOptional()
  @IsString()
  description?: string | null;
}
