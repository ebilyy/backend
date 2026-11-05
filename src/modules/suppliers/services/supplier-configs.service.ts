import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierConfigDto, UpdateSupplierConfigDto } from '../dto';
import { SupplierConfig } from '../entities/supplier-config.entity';
import { SupplierConfigsRepository } from '../repositories/supplier-configs.repository';
import { SuppliersService } from './suppliers.service';

@Injectable()
export class SupplierConfigsService {
  constructor(
    private readonly supplierConfigsRepository: SupplierConfigsRepository,
    private readonly suppliersService: SuppliersService,
  ) {}

  // Спершу перевіряємо постачальника: інакше неіснуючий і постачальник без
  // конфігів однаково повертали б порожній масив.
  async findAll(supplierId: number): Promise<SupplierConfig[]> {
    await this.suppliersService.findOne(supplierId);

    return this.supplierConfigsRepository.findBySupplier(supplierId);
  }

  async findOne(supplierId: number, id: number): Promise<SupplierConfig> {
    await this.suppliersService.findOne(supplierId);

    const config = await this.supplierConfigsRepository.findForSupplier(
      supplierId,
      id,
    );

    if (!config) {
      throw new NotFoundException(
        `Конфіг з id ${id} у постачальника ${supplierId} не знайдено`,
      );
    }

    return config;
  }

  // Видаленому постачальнику конфіг не створиться: findOne його не бачить,
  // а FK на рядок, що лишився в таблиці, сам цього не завадив би.
  async create(
    supplierId: number,
    configData: CreateSupplierConfigDto,
  ): Promise<SupplierConfig> {
    await this.suppliersService.findOne(supplierId);

    return this.supplierConfigsRepository.createConfig(supplierId, configData);
  }

  async update(
    supplierId: number,
    id: number,
    configData: UpdateSupplierConfigDto,
  ): Promise<SupplierConfig> {
    await this.findOne(supplierId, id);
    await this.supplierConfigsRepository.updateConfig(id, configData);

    return this.findOne(supplierId, id);
  }

  async delete(supplierId: number, id: number): Promise<SupplierConfig> {
    await this.findOne(supplierId, id);
    await this.supplierConfigsRepository.softDeleteConfig(id);

    return (await this.supplierConfigsRepository.findForSupplier(
      supplierId,
      id,
      true,
    )) as SupplierConfig;
  }
}
