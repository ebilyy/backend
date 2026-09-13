import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginate,
  Paginated,
  PaginationQueryDto,
} from '../../../common/pagination';
import { Supplier } from '../entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from '../dto';
import { SuppliersRepository } from '../repositories/suppliers.repository';

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  async findAll(pagination: PaginationQueryDto): Promise<Paginated<Supplier>> {
    return paginate(
      await this.suppliersRepository.findAllSuppliers(pagination),
      pagination,
    );
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findById(id);

    if (!supplier) {
      throw new NotFoundException(`Постачальника з id ${id} не знайдено`);
    }

    return supplier;
  }

  async create(supplierData: CreateSupplierDto): Promise<Supplier> {
    await this.ensureEmailIsFree(supplierData.email);

    return this.suppliersRepository.createSupplier(supplierData);
  }

  async update(id: number, supplierData: UpdateSupplierDto): Promise<Supplier> {
    await this.findOne(id);

    if (supplierData.email) {
      await this.ensureEmailIsFree(supplierData.email, id);
    }

    await this.suppliersRepository.updateSupplier(id, supplierData);

    return this.findOne(id);
  }

  async delete(id: number): Promise<Supplier> {
    await this.findOne(id);
    await this.suppliersRepository.softDeleteSupplier(id);

    return (await this.suppliersRepository.findById(id, true)) as Supplier;
  }

  private async ensureEmailIsFree(email: string, exceptId?: number) {
    const existing = await this.suppliersRepository.findByEmail(email, true);

    if (!existing || existing.id === exceptId) {
      return;
    }

    throw new ConflictException(
      existing.deletedAt
        ? `Email ${email} зайнятий видаленим постачальником (id ${existing.id})`
        : `Постачальник з email ${email} вже існує`,
    );
  }
}
