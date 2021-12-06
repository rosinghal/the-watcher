import axios from "axios";

export interface AuditLog {
	id: string;
	action: {
		type: "change_setting" | "rec_add" | "rec_del" | "rec_set";
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
		`https://api.cloudflare.com/client/v4/organizations/${params.orgId}/audit_logs?action.type=add&action.type=set&action.type=delete&since=${params.since}&before=${params.before}`,
		{
			headers: {
				"X-Auth-Email": headers.authEmail,
				"X-Auth-Key": headers.authKey,
				"Content-Type": "application/json",
			},
		}
	);
};
