import axios from "axios";
import { App } from "@slack/bolt";
import { IsNull, Not } from "typeorm";
import { AppConfig } from "../entities/appConfig";
import dayjs from "dayjs";
import { ChatPostMessageArguments } from "@slack/web-api";
import { ContextBlock } from "@slack/types";
import { AppDataSource } from "../data-source";

export interface AuditLog {
	id: string;
	action: {
		type: "change_setting" | "rec_add" | "rec_del" | "rec_set" | "purge" | "login" | "API_key_view" | "API_key_created" | "API_key_deactivated" | "rotate_API_key" | "tls_settings_deployed" | "add";
		result: boolean;
	};
	actor: {
		id: string;
		email: string;
		type: "user";
		ip: string;
	};
	resource: {
		type: "zone" | "DNS_record";
		id: string;
	};
	interface: "API" | "UI";
	metadata: {
		zone_name: string;
	};
	when: string;
	newValueJson?: {
		content: string;
		id: string;
		name: string;
		proxied: boolean;
		ttl: number;
		type: true;
		zone_id: string;
		zone_name: string;
	};
	oldValueJson?: {
		content: string;
		id: string;
		name: string;
		proxied: boolean;
		ttl: number;
		type: true;
		zone_id: string;
		zone_name: string;
	};
}

interface AuditLogsResponse {
	success: boolean;
	errors: null;
	messages: [];
	result: AuditLog[];
}

export const getAuditLogs = (
	headers: {
		authEmail: string;
		authKey: string;
	},
	params: {
        orgId: string;
		since: string;
		before: string;
	}
) => {
	console.log(
		`Fetching CloudFlare logs for org #${params.orgId} between ${params.since} and ${params.before}`
	);

	return axios.get<AuditLogsResponse>(
		`https://api.cloudflare.com/client/v4/organizations/${params.orgId}/audit_logs?action.type=add&action.type=set&action.type=delete&action.type=purge&since=${params.since}&before=${params.before}`,
		{
			headers: {
				"X-Auth-Email": headers.authEmail,
				"X-Auth-Key": headers.authKey,
				"Content-Type": "application/json",
			},
		}
	);
};

const getAuditLogTitle = (auditLog: AuditLog) => {
	switch (auditLog.action.type) {
		case "rec_add":
			return "DNS record added";

		case "rec_del":
			return "DNS record deleted";

		case "rec_set":
			return "DNS record updated";

		case "purge":
			return `${auditLog.metadata.zone_name} deleted`;

		case "add":
			return `${auditLog.metadata.zone_name} added`;

		default:
			return "";
	}
};

const getAuditLogData = (
	auditLog: AuditLog
):
	| {
			text: string;
			blocks: ChatPostMessageArguments["blocks"];
	  }
	| "" => {
	const text = getAuditLogTitle(auditLog);
	switch (auditLog.action.type) {
		case "rec_add":
		case "rec_del":
		case "rec_set":
		case "add":
		case "purge":
			return {
				text,
				blocks: getAuditLogDNSBlocks(auditLog),
			};

		default:
			return "";
	}
};

const getAuditLogDNSBlocks = (
	auditLog: AuditLog
): ChatPostMessageArguments["blocks"] => {
	const blocks: ChatPostMessageArguments["blocks"] = [
		{
			type: "section",
			text: {
				type: "plain_text",
				text: getAuditLogTitle(auditLog),
			},
		},
	];
	if (auditLog.newValueJson && !auditLog.oldValueJson) {
		// in case of rec_add
		blocks.push({
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: `Domain: ${auditLog.newValueJson.zone_name}`,
				},
				{
					type: "mrkdwn",
					text: `Type: ${auditLog.newValueJson.type}`,
				},
				{
					type: "mrkdwn",
					text: `Name: ${auditLog.newValueJson.name}`,
				},
				{
					type: "mrkdwn",
					text: `Value: ${auditLog.newValueJson.content}`,
				},
				{
					type: "mrkdwn",
					text: `TTL: ${auditLog.newValueJson.ttl}`,
				},
				{
					type: "mrkdwn",
					text: `Proxy: ${auditLog.newValueJson.proxied}`,
				},
			],
		});
	}
	if (auditLog.oldValueJson && !auditLog.newValueJson) {
		// in case of rec_del
		blocks.push({
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: `Domain: ${auditLog.oldValueJson.zone_name}`,
				},
				{
					type: "mrkdwn",
					text: `Name: ${auditLog.oldValueJson.name}`,
				},
				{
					type: "mrkdwn",
					text: `Value: ${auditLog.oldValueJson.content}`,
				},
			],
		});
	}
	if (auditLog.oldValueJson && auditLog.newValueJson) {
		// in case of rec_set
		const blockElements: ContextBlock["elements"] = [];

		if (
			auditLog.newValueJson.zone_name !== auditLog.oldValueJson.zone_name
		) {
			blockElements.push({
				type: "mrkdwn",
				text: `Domain: ${auditLog.newValueJson.zone_name}`,
			});
			blockElements.push({
				type: "mrkdwn",
				text: `Old Domain: ${auditLog.oldValueJson.zone_name}`,
			});
		} else {
			blockElements.push({
				type: "mrkdwn",
				text: `Domain: ${auditLog.newValueJson.zone_name}`,
			});
		}

		if (auditLog.newValueJson.type !== auditLog.oldValueJson.type) {
			blockElements.push({
				type: "mrkdwn",
				text: `Type: ${auditLog.newValueJson.type}`,
			});
			blockElements.push({
				type: "mrkdwn",
				text: `Old Type: ${auditLog.oldValueJson.type}`,
			});
		} else {
			blockElements.push({
				type: "mrkdwn",
				text: `Type: ${auditLog.newValueJson.type}`,
			});
		}

		if (auditLog.newValueJson.name !== auditLog.oldValueJson.name) {
			blockElements.push({
				type: "mrkdwn",
				text: `Name: ${auditLog.newValueJson.name}`,
			});
			blockElements.push({
				type: "mrkdwn",
				text: `Old Name: ${auditLog.oldValueJson.name}`,
			});
		} else {
			blockElements.push({
				type: "mrkdwn",
				text: `Name: ${auditLog.newValueJson.name}`,
			});
		}

		if (auditLog.newValueJson.content !== auditLog.oldValueJson.content) {
			blockElements.push({
				type: "mrkdwn",
				text: `Value: ${auditLog.newValueJson.content}`,
			});
			blockElements.push({
				type: "mrkdwn",
				text: `Old Value: ${auditLog.oldValueJson.content}`,
			});
		}

		if (auditLog.newValueJson.ttl !== auditLog.oldValueJson.ttl) {
			blockElements.push({
				type: "mrkdwn",
				text: `TTL: ${auditLog.newValueJson.ttl}`,
			});
			blockElements.push({
				type: "mrkdwn",
				text: `Old TTL: ${auditLog.oldValueJson.ttl}`,
			});
		}

		if (auditLog.newValueJson.proxied !== auditLog.oldValueJson.proxied) {
			blockElements.push({
				type: "mrkdwn",
				text: `Proxy: ${auditLog.newValueJson.proxied}`,
			});
			blockElements.push({
				type: "mrkdwn",
				text: `Old Proxy: ${auditLog.oldValueJson.proxied}`,
			});
		}

		blocks.push({
			type: "context",
			elements: blockElements,
		});
	}

	return [
		...blocks,
		{
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: `Actor: ${auditLog.actor.email}`,
				},
			],
		},
	];
};

export const checkLatestCloudflareLogs = async (app: App) => {
	try {
		const appConfigRepository = AppDataSource.getRepository(AppConfig);
		const appConfigs = await appConfigRepository.find({
			where: {
				cloudflareAuthEmail: Not(IsNull()),
				cloudflareAuthKey: Not(IsNull()),
				cloudflareSlackChannelId: Not(IsNull()),
			},
		});

		for await (const appConfig of appConfigs) {
			console.log(`Processing for ${appConfig.slackTeamName}`);

			if (
				appConfig.cloudflareSlackChannelId &&
				appConfig.cloudflareAuthEmail &&
				appConfig.cloudflareAuthKey &&
				appConfig.cloudflareOrgId
			) {
				const currentTime = dayjs();
				const since = dayjs(
					appConfig.cloudflareLastCheckedAt ||
						dayjs().subtract(1, "week")
				);
				const auditLogs = await getAuditLogs(
					{
						authEmail: appConfig.cloudflareAuthEmail,
						authKey: appConfig.cloudflareAuthKey,
					},
					{
						since: since.toISOString(),
						before: currentTime.toISOString(),
						orgId: appConfig.cloudflareOrgId,
					}
				);

				console.log(`Found ${auditLogs.data.result.length} new logs`);

				for (const auditLog of auditLogs.data.result) {
					const data = getAuditLogData(auditLog);
					if (data) {
						await app.client.chat.postMessage({
							token: appConfig.slackAccessToken,
							channel: appConfig.cloudflareSlackChannelId,
							...data,
						});
					}
				}

				appConfig.cloudflareLastCheckedAt = currentTime.toDate();
				await AppDataSource.manager.save(appConfig);
			}
		}
	} catch (error: any) {
		console.log(`Failed to run cron, reason is ${error.message}!`);
	}
};
