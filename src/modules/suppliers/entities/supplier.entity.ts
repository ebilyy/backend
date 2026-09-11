import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/entity/abstract.entity';

@Entity('suppliers')
export class Supplier extends AbstractEntity {
  @Column({ name: 'name', length: 255 })
  name: string;

  // Унікальність на рівні БД, бо перевірка в сервісі не рятує від гонки.
  @Index({ unique: true })
  @Column({ name: 'email', length: 255 })
  email: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;
}
