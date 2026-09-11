import {
	CreateDateColumn,
	DeleteDateColumn,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

export abstract class AbstractEntity {

	@PrimaryGeneratedColumn('increment', {name: 'id'})
	readonly id: number;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamptz',
		default: () => 'CURRENT_TIMESTAMP'
	})
	createdAt: Date;

	@UpdateDateColumn({
		name: 'updated_at',
		type: 'timestamptz',
		default: () => 'CURRENT_TIMESTAMP'
	})
	updatedAt: Date;

	// softRemove() проставляє дату, звичайні find() такі рядки вже не бачать.
	@DeleteDateColumn({
		name: 'deleted_at',
		type: 'timestamptz',
		nullable: true
	})
	deletedAt: Date | null;

}
