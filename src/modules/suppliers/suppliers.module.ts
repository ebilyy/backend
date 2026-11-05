import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportFieldsController } from './controllers/import-fields.controller';
import { SupplierConfigsController } from './controllers/supplier-configs.controller';
import { SuppliersController } from './controllers/suppliers.controller';
import { SupplierConfig } from './entities/supplier-config.entity';
import { Supplier } from './entities/supplier.entity';
import { SupplierConfigsRepository } from './repositories/supplier-configs.repository';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { SupplierConfigsService } from './services/supplier-configs.service';
import { SuppliersService } from './services/suppliers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, SupplierConfig])],
  controllers: [
    SuppliersController,
    SupplierConfigsController,
    ImportFieldsController,
  ],
  providers: [
    SuppliersRepository,
    SuppliersService,
    SupplierConfigsRepository,
    SupplierConfigsService,
  ],
  exports: [
    SuppliersService,
    SuppliersRepository,
    SupplierConfigsService,
    SupplierConfigsRepository,
  ],
})
export class SuppliersModule {}
