import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateSupplierConfigDto } from '../dto';
import { SupplierConfigsRepository } from '../repositories/supplier-configs.repository';
import { SupplierConfigsService } from './supplier-configs.service';
import { SuppliersService } from './suppliers.service';

describe('SupplierConfigsService', () => {
  let service: SupplierConfigsService;
  const repository = {
    findBySupplier: jest.fn(),
    findForSupplier: jest.fn(),
    createConfig: jest.fn(),
    updateConfig: jest.fn(),
    softDeleteConfig: jest.fn(),
  };
  const suppliersService = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierConfigsService,
        { provide: SupplierConfigsRepository, useValue: repository },
        { provide: SuppliersService, useValue: suppliersService },
      ],
    }).compile();

    service = module.get(SupplierConfigsService);
  });

  it('не читає конфіги, якщо постачальника немає', async () => {
    suppliersService.findOne.mockRejectedValue(new NotFoundException());

    await expect(service.findAll(7)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findBySupplier).not.toHaveBeenCalled();
  });

  it('повертає конфіги постачальника', async () => {
    const configs = [{ id: 1, supplierId: 7 }];
    suppliersService.findOne.mockResolvedValue({ id: 7 });
    repository.findBySupplier.mockResolvedValue(configs);

    await expect(service.findAll(7)).resolves.toBe(configs);
    expect(repository.findBySupplier).toHaveBeenCalledWith(7);
  });

  it('віддає 404 на конфіг іншого постачальника', async () => {
    suppliersService.findOne.mockResolvedValue({ id: 7 });
    repository.findForSupplier.mockResolvedValue(null);

    await expect(service.findOne(7, 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.findForSupplier).toHaveBeenCalledWith(7, 3);
  });

  it('не створює конфіг неіснуючому постачальнику', async () => {
    suppliersService.findOne.mockRejectedValue(new NotFoundException());

    await expect(
      service.create(7, {} as CreateSupplierConfigDto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.createConfig).not.toHaveBeenCalled();
  });

  it('створює конфіг для постачальника зі шляху', async () => {
    const dto = { name: 'Основний прайс' } as CreateSupplierConfigDto;
    const created = { id: 1, supplierId: 7 };
    suppliersService.findOne.mockResolvedValue({ id: 7 });
    repository.createConfig.mockResolvedValue(created);

    await expect(service.create(7, dto)).resolves.toBe(created);
    expect(repository.createConfig).toHaveBeenCalledWith(7, dto);
  });

  it('не оновлює конфіг іншого постачальника', async () => {
    suppliersService.findOne.mockResolvedValue({ id: 7 });
    repository.findForSupplier.mockResolvedValue(null);

    await expect(
      service.update(7, 3, { name: 'Новий' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updateConfig).not.toHaveBeenCalled();
  });

  it('оновлює і повертає свіжий рядок', async () => {
    const fresh = { id: 3, supplierId: 7, name: 'Новий' };
    suppliersService.findOne.mockResolvedValue({ id: 7 });
    repository.findForSupplier
      .mockResolvedValueOnce({ id: 3, supplierId: 7, name: 'Старий' })
      .mockResolvedValueOnce(fresh);

    await expect(service.update(7, 3, { name: 'Новий' })).resolves.toBe(fresh);
    expect(repository.updateConfig).toHaveBeenCalledWith(3, { name: 'Новий' });
  });

  it('не видаляє конфіг іншого постачальника', async () => {
    suppliersService.findOne.mockResolvedValue({ id: 7 });
    repository.findForSupplier.mockResolvedValue(null);

    await expect(service.delete(7, 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.softDeleteConfig).not.toHaveBeenCalled();
  });

  it('видаляє м’яко і повертає рядок разом з deletedAt', async () => {
    const deleted = { id: 3, supplierId: 7, deletedAt: new Date() };
    suppliersService.findOne.mockResolvedValue({ id: 7 });
    repository.findForSupplier
      .mockResolvedValueOnce({ id: 3, supplierId: 7 })
      .mockResolvedValueOnce(deleted);

    await expect(service.delete(7, 3)).resolves.toBe(deleted);
    expect(repository.softDeleteConfig).toHaveBeenCalledWith(3);
    expect(repository.findForSupplier).toHaveBeenLastCalledWith(7, 3, true);
  });
});
