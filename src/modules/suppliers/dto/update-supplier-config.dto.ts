import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateSupplierConfigDto } from './create-supplier-config.dto';

// columns, якщо передано, замінює масив цілком, тож проходить ті самі
// перевірки, що й при створенні, зокрема на обов'язкові поля.
@ApiSchema({
  description: 'Хоча б одне поле обов’язкове; columns замінюється цілком',
})
export class UpdateSupplierConfigDto extends PartialType(
  CreateSupplierConfigDto,
  { skipNullProperties: false },
) {}
