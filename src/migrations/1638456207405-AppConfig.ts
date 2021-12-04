import {MigrationInterface, QueryRunner} from "typeorm";

export class AppConfig1638456207405 implements MigrationInterface {
    name = 'AppConfig1638456207405'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`app_config\` (\`id\` int NOT NULL AUTO_INCREMENT, \`slackTeamName\` varchar(255) NOT NULL, \`slackTeamId\` varchar(255) NOT NULL, \`slackAccessToken\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`app_config\``);
    }

}
