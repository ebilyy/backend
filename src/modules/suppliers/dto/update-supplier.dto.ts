import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateSupplierDto } from './create-supplier.dto';

// PartialType зі @nestjs/swagger переносить і правила валідації, і
// Swagger-метадані. skipNullProperties: false — інакше null у name/email
// пройшов би валідацію і впав уже на NOT NULL у БД.
@ApiSchema({ description: 'Хоча б одне поле обов’язкове' })
export class UpdateSupplierDto extends PartialType(CreateSupplierDto, {
  skipNullProperties: false,
}) {}
