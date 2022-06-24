import {MigrationInterface, QueryRunner} from "typeorm";

export class init1656045284721 implements MigrationInterface {
    name = 'init1656045284721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "app_config" ("id" SERIAL NOT NULL, "slackTeamName" character varying NOT NULL, "slackTeamId" character varying NOT NULL, "slackAccessToken" character varying NOT NULL, "cloudflareOrgId" character varying, "cloudflareAuthKey" character varying, "cloudflareAuthEmail" character varying, "cloudflareSlackChannelId" character varying, "cloudflareLastCheckedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ccdbb6f00e8113d8953476a507b" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "app_config"`);
    }

}
