import { Authorize } from "@slack/bolt";
import { AppConfig } from "../entities/appConfig";

export const authorizeFn: Authorize<boolean> = async ({
	teamId,
}): Promise<AppConfig> => {
	if (teamId) {
		const existingAppConfig = await AppConfig.findOne({
			where: {
				slackTeamId: teamId,
			}
		});

		if (existingAppConfig) {
			return existingAppConfig;
		}
	}

	throw new Error("No matching authorizations");
};
