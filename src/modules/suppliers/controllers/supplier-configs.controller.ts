import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NonEmptyBodyPipe } from '../../../common/pipes';
import { CreateSupplierConfigDto, UpdateSupplierConfigDto } from '../dto';
import { SupplierConfig } from '../entities/supplier-config.entity';
import { SupplierConfigsService } from '../services/supplier-configs.service';

@ApiTags('supplier-configs')
@Controller('suppliers/:supplierId/configs')
export class SupplierConfigsController {
  constructor(
    private readonly supplierConfigsService: SupplierConfigsService,
  ) {}

  @Get()
  @ApiOkResponse({ type: [SupplierConfig] })
  findAll(@Param('supplierId', ParseIntPipe) supplierId: number) {
    return this.supplierConfigsService.findAll(supplierId);
  }

  @Get(':id')
  @ApiOkResponse({ type: SupplierConfig })
  findOne(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.supplierConfigsService.findOne(supplierId, id);
  }

  @Post()
  @ApiCreatedResponse({ type: SupplierConfig })
  create(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Body() dto: CreateSupplierConfigDto,
  ) {
    return this.supplierConfigsService.create(supplierId, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: SupplierConfig })
  update(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(NonEmptyBodyPipe) dto: UpdateSupplierConfigDto,
  ) {
    return this.supplierConfigsService.update(supplierId, id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: SupplierConfig })
  delete(
    @Param('supplierId', ParseIntPipe) supplierId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.supplierConfigsService.delete(supplierId, id);
  }
}
