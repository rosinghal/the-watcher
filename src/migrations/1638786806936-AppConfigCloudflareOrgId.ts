import {MigrationInterface, QueryRunner} from "typeorm";

export class AppConfigCloudflareOrgId1638786806936 implements MigrationInterface {
    name = 'AppConfigCloudflareOrgId1638786806936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`app_config\` ADD \`cloudflareOrgId\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`app_config\` DROP COLUMN \`cloudflareOrgId\``);
    }

}
