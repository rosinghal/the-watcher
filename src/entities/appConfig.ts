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

	@Column({ nullable: true })
	cloudflareOrgId?: string;

	@Column({ nullable: true })
	cloudflareAuthKey?: string;

	@Column({ nullable: true })
	cloudflareAuthEmail?: string;

	@Column({ nullable: true })
	cloudflareSlackChannelId?: string;

	@Column({ nullable: true, type: "datetime" })
	cloudflareLastCheckedAt?: Date;

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
