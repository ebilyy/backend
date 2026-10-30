import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileUploads1793367921947 implements MigrationInterface {
    name = 'AddFileUploads1793367921947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "file_uploads" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "original_name" text NOT NULL, "storage_key" character varying(255) NOT NULL, "extension" character varying(10), "mime_type" text NOT NULL, "size_bytes" integer NOT NULL, "content_hash" character(64) NOT NULL, CONSTRAINT "PK_b3ebfc99a8b660f0bc64a052b42" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f5132903fbf06fbc6c3a8a9412" ON "file_uploads" ("content_hash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f5132903fbf06fbc6c3a8a9412"`);
        await queryRunner.query(`DROP TABLE "file_uploads"`);
    }

}
