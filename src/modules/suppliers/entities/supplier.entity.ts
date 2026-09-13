import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { AbstractEntity } from '../../../common/entity/abstract.entity';

@Entity('suppliers')
export class Supplier extends AbstractEntity {
  @ApiProperty({ example: 'ТОВ «Ромашка»' })
  @Column({ name: 'name', length: 255 })
  name: string;

  // Унікальність на рівні БД, бо перевірка в сервісі не рятує від гонки.
  @ApiProperty({ example: 'sales@romashka.ua' })
  @Index({ unique: true })
  @Column({ name: 'email', length: 255 })
  email: string;

  @ApiProperty({ type: String, nullable: true, example: 'Постачає канцелярію' })
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;
}
