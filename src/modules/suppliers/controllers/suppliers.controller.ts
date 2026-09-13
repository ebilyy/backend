import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '../../../common/dto';
import {
  ApiPaginatedResponse,
  paginationQuerySchema,
} from '../../../common/pagination';
import type { PaginationQueryDto } from '../../../common/pagination';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { ApiZodBody, ApiZodQuery } from '../../../common/swagger';
import { createSupplierSchema, updateSupplierSchema } from '../dto';
import type { CreateSupplierDto, UpdateSupplierDto } from '../dto';
import { Supplier } from '../entities/supplier.entity';
import { SuppliersService } from '../services/suppliers.service';

@ApiTags('suppliers')
@ApiBadRequestResponse({
  description: 'Дані не пройшли валідацію',
  type: ValidationErrorResponseDto,
})
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({
    summary: 'Список постачальників',
  })
  @ApiZodQuery(paginationQuerySchema)
  @ApiPaginatedResponse(Supplier)
  findAll(
    @Query(new ZodValidationPipe(paginationQuerySchema))
    pagination: PaginationQueryDto,
  ) {
    return this.suppliersService.findAll(pagination);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: Supplier })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Створити постачальника' })
  @ApiZodBody(createSupplierSchema)
  @ApiCreatedResponse({ type: Supplier })
  @ApiConflictResponse({
    description: 'Email уже зайнятий, зокрема й видаленим постачальником',
    type: ErrorResponseDto,
  })
  create(
    @Body(new ZodValidationPipe(createSupplierSchema)) dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.delete(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Оновити постачальника' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiZodBody(updateSupplierSchema, 'Хоча б одне поле обов’язкове')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateSupplierSchema)) dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }
}
