import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreateSupplierDto, UpdateSupplierDto } from '../dto';
import { Supplier } from '../entities/supplier.entity';

@Injectable()
export class SuppliersRepository extends Repository<Supplier> {
  constructor(dataSource: DataSource) {
    super(Supplier, dataSource.createEntityManager());
  }

  findByEmail(email: string, includeDeleted = false) {
    return this.findOne({ where: { email }, withDeleted: includeDeleted });
  }

  findById(id: number, includeDeleted = false) {
    return this.findOne({ where: { id }, withDeleted: includeDeleted });
  }

  findAllSuppliers() {
    return this.find();
  }

  createSupplier(supplierData: CreateSupplierDto) {
    const newSupplier = this.create(supplierData);
    return this.save(newSupplier);
  }

  updateSupplier(id: number, supplierData: UpdateSupplierDto) {
    return this.update(id, supplierData);
  }

  softDeleteSupplier(id: number) {
    return this.softDelete(id);
  }
}
