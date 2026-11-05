import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplierConfigs1793883263993 implements MigrationInterface {
  name = 'AddSupplierConfigs1793883263993';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "supplier_configs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "supplier_id" integer NOT NULL, "sheet_name" character varying(255), "header_row" integer NOT NULL, "currency" character varying(3) NOT NULL, "columns" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_5b8e497771467efee18bea04e8f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56010e445b67360816050da5af" ON "supplier_configs"  ("supplier_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_configs" ADD CONSTRAINT "FK_56010e445b67360816050da5aff" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supplier_configs" DROP CONSTRAINT "FK_56010e445b67360816050da5aff"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56010e445b67360816050da5af"`,
    );
    await queryRunner.query(`DROP TABLE "supplier_configs"`);
  }
}
