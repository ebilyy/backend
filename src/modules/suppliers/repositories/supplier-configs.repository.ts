import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreateSupplierConfigDto, UpdateSupplierConfigDto } from '../dto';
import { SupplierConfig } from '../entities/supplier-config.entity';

@Injectable()
export class SupplierConfigsRepository extends Repository<SupplierConfig> {
  constructor(dataSource: DataSource) {
    super(SupplierConfig, dataSource.createEntityManager());
  }

  // Конфігів у постачальника одиниці, тож без пагінації; порядок за id —
  // щоб список не перемішувався між запитами.
  findBySupplier(supplierId: number) {
    return this.find({ where: { supplierId }, order: { id: 'ASC' } });
  }

  // supplierId у where — щоб чужий конфіг не відкривався через URL іншого
  // постачальника.
  findForSupplier(supplierId: number, id: number, includeDeleted = false) {
    return this.findOne({
      where: { id, supplierId },
      withDeleted: includeDeleted,
    });
  }

  createConfig(supplierId: number, configData: CreateSupplierConfigDto) {
    const newConfig = this.create({ ...configData, supplierId });
    return this.save(newConfig);
  }

  updateConfig(id: number, configData: UpdateSupplierConfigDto) {
    return this.update(id, configData);
  }

  softDeleteConfig(id: number) {
    return this.softDelete(id);
  }
}
