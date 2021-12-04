import {
	Entity,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	BaseEntity,
	PrimaryGeneratedColumn,
} from "typeorm";

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
}
