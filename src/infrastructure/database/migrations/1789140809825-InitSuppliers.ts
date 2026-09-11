import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSuppliers1789140809825 implements MigrationInterface {
    name = 'InitSuppliers1789140809825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "description" text, CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_66181e465a65c2ddcfa9c00c9c" ON "suppliers"  ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_66181e465a65c2ddcfa9c00c9c"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
    }

}
