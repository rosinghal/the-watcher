import {MigrationInterface, QueryRunner} from "typeorm";

export class AppConfigCloudflare1638530114906 implements MigrationInterface {
    name = 'AppConfigCloudflare1638530114906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`app_config\` ADD \`cloudflareAuthKey\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`app_config\` ADD \`cloudflareSlackChannelId\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`app_config\` DROP COLUMN \`cloudflareSlackChannelId\``);
        await queryRunner.query(`ALTER TABLE \`app_config\` DROP COLUMN \`cloudflareAuthKey\``);
    }

}
