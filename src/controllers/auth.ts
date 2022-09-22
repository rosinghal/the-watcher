import { Authorize } from "@slack/bolt";
import { AppDataSource } from "../data-source";
import { AppConfig } from "../entities/appConfig";

export const authorizeFn: Authorize<boolean> = async ({
	teamId,
}): Promise<AppConfig> => {
	if (teamId) {
		const appConfigRepository = AppDataSource.getRepository(AppConfig);
		const existingAppConfig = await appConfigRepository.findOne({
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
