import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersController } from './controllers/suppliers.controller';
import { Supplier } from './entities/supplier.entity';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { SuppliersService } from './services/suppliers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  controllers: [SuppliersController],
  providers: [SuppliersRepository, SuppliersService],
  exports: [SuppliersService, SuppliersRepository],
})
export class SuppliersModule {}
