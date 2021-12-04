import {MigrationInterface, QueryRunner} from "typeorm";

export class AppConfigCloudflareLastCheckedAt1638540775276 implements MigrationInterface {
    name = 'AppConfigCloudflareLastCheckedAt1638540775276'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`app_config\` ADD \`cloudflareLastCheckedAt\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`app_config\` DROP COLUMN \`cloudflareLastCheckedAt\``);
    }

}
