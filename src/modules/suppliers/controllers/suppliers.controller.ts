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
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiZodQuery(paginationQuerySchema)
  @ApiPaginatedResponse(Supplier)
  findAll(
    @Query(new ZodValidationPipe(paginationQuerySchema))
    pagination: PaginationQueryDto,
  ) {
    return this.suppliersService.findAll(pagination);
  }

  @Get(':id')
  @ApiOkResponse({ type: Supplier })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @ApiZodBody(createSupplierSchema)
  @ApiCreatedResponse({ type: Supplier })
  create(
    @Body(new ZodValidationPipe(createSupplierSchema)) dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: Supplier })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.delete(id);
  }

  @Patch(':id')
  @ApiZodBody(updateSupplierSchema)
  @ApiOkResponse({ type: Supplier })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateSupplierSchema)) dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }
}
