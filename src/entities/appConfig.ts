import {
	Entity,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	BaseEntity,
	PrimaryGeneratedColumn,
	BeforeInsert,
	AfterInsert,
	AfterLoad,
	BeforeUpdate,
} from "typeorm";
import CryptoJS from "crypto-js";

@Entity()
export class AppConfig extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	slackTeamName: string;

	@Column()
	slackTeamId: string;

	@Column()
	slackAccessToken: string;

	@Column({ nullable: true, type: "varchar" })
	cloudflareOrgId: string | null;

	@Column({ nullable: true, type: "varchar" })
	cloudflareAuthKey: string | null;

	@Column({ nullable: true, type: "varchar" })
	cloudflareAuthEmail: string | null;

	@Column({ nullable: true, type: "varchar" })
	cloudflareSlackChannelId: string | null;

	@Column({ nullable: true, type: "timestamp without time zone" })
	cloudflareLastCheckedAt: Date | null;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@BeforeInsert()
	@BeforeUpdate()
	encryptData() {
		if (this.cloudflareAuthKey) {
			this.cloudflareAuthKey = CryptoJS.AES.encrypt(
				this.cloudflareAuthKey,
				process.env.CRYPT_KEY as string
			).toString();
		}
	}

	@AfterInsert()
	@AfterLoad()
	decryptData() {
		if (this.cloudflareAuthKey) {
			this.cloudflareAuthKey = CryptoJS.AES.decrypt(
				this.cloudflareAuthKey,
				process.env.CRYPT_KEY as string
			).toString(CryptoJS.enc.Utf8);
		}
	}
}
