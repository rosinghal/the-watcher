import {MigrationInterface, QueryRunner} from "typeorm";

export class AppConfigCloudflareAuthEmail1638531786987 implements MigrationInterface {
    name = 'AppConfigCloudflareAuthEmail1638531786987'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`app_config\` ADD \`cloudflareAuthEmail\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`app_config\` DROP COLUMN \`cloudflareAuthEmail\``);
    }

}
