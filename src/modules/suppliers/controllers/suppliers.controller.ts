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
  PaginationQueryDto,
} from '../../../common/pagination';
import { NonEmptyBodyPipe } from '../../../common/pipes';
import { CreateSupplierDto, UpdateSupplierDto } from '../dto';
import { Supplier } from '../entities/supplier.entity';
import { SuppliersService } from '../services/suppliers.service';

@ApiTags('suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiPaginatedResponse(Supplier)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.suppliersService.findAll(pagination);
  }

  @Get(':id')
  @ApiOkResponse({ type: Supplier })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @ApiCreatedResponse({ type: Supplier })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: Supplier })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.delete(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: Supplier })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(NonEmptyBodyPipe) dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }
}
