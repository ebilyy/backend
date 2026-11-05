import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IMPORT_FIELDS, ImportField } from '../import-fields';

// Окремий шлях, а не /suppliers/fields: інакше «fields» ловив би
// GET /suppliers/:id і падав на ParseIntPipe.
@ApiTags('supplier-configs')
@Controller('import-fields')
export class ImportFieldsController {
  @Get()
  @ApiOkResponse({ type: [ImportField] })
  findAll() {
    return IMPORT_FIELDS;
  }
}
