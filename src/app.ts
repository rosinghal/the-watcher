import "reflect-metadata";
import { App, Authorize, ExpressReceiver } from "@slack/bolt";
import { createConnection } from "typeorm";
import { AppConfig } from "./entities/appConfig";
import axios from "axios";
import dayjs from "dayjs";

const receiver = new ExpressReceiver({
	signingSecret: String(process.env.SLACK_SIGNING_SECRET),
});



const authorizeFn: Authorize<boolean> = async ({ teamId }) => {

  if (teamId) {
    const existingAppConfig = await AppConfig.findOne({
      slackTeamId: teamId,
    });

    if (existingAppConfig) {
      return existingAppConfig;
    }
  }

  throw new Error('No matching authorizations');
}

// https://app.slack.com/app-settings/T02PUHPD0MN/A02P4RZ9SNN/app-manifest
const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
  authorize: authorizeFn,
	// socketMode:true, // enable the following to use socket mode
	// appToken: process.env.SLACK_APP_TOKEN,
	receiver,
});

const express = receiver.router;

express.get("/", (req, res) => {
	console.log("Redirecting");
	res.redirect(
		`https://slack.com/oauth/v2/authorize?client_id=${
			process.env.SLACK_CLIENT_ID
		}&scope=app_mentions:read,channels:history,commands,groups:history,im:history,im:read,im:write,mpim:history,chat:write&user_scope=&redirect_uri=${
			String(process.env.HOST) + "/slack/callback"
		}`
	);
	res.end();
});

app.command(
	"/cloudflarewatcherauthkey",
	async ({ command, ack, say }) => {
		console.log(command);

		try {
			await ack();
			const [cloudflareAuthEmail, cloudflareAuthKey] =
				command.text.split(" ");
			const existingAppConfig = await AppConfig.findOne({
				slackTeamId: command.team_id,
			});

			if (!existingAppConfig) {
        await say("Error: Slack app not configured with Watcher!");
				return;
			}

			axios
				.get(
					`https://api.cloudflare.com/client/v4/user/audit_logs?action.type=add&action.type=set&action.type=delete&since=${dayjs()
						.subtract(1, "day")
						.format("YYYY-MM-DD")}&before=${dayjs().format(
						"YYYY-MM-DD"
					)}`,
					{
						headers: {
							"X-Auth-Email": cloudflareAuthEmail,
							"X-Auth-Key": cloudflareAuthKey,
							"Content-Type": "application/json",
						},
					}
				)
				.then(async (cloudFlareResponse) => {
					console.log(cloudFlareResponse.data);

          existingAppConfig.cloudflareAuthEmail = cloudflareAuthEmail;
          existingAppConfig.cloudflareAuthKey = cloudflareAuthKey;
          existingAppConfig.cloudflareSlackChannelId = command.channel_id;
          existingAppConfig.cloudflareLastCheckedAt = dayjs().toDate();
          await existingAppConfig.save();

          await say("Yaaay! Now you will get Cloudflare changes in this channel!");
					return;
				})
				.catch(async () => {
          await say("Error: Invalid data provided. Get Global API Key from https://dash.cloudflare.com/profile/api-tokens.");
					return;
				});
		} catch (error: any) {
      await say(`Error: ${error.message}`);
			return;
		}
	}
);

app.message(async ({ say, message }) => {
	try {
    await say({
      thread_ts: message.event_ts,
      text: "I am dumb, not sure why you are sending message to me!"
    });
	} catch (error) {
		console.log("err");
		console.error(error);
	}
});

express.get("/slack/callback", async (req, res) => {
	const data = {
		client_id: String(process.env.SLACK_CLIENT_ID),
		client_secret: String(process.env.SLACK_CLIENT_SECRET),
		code: String(req.query.code),
		redirect_uri: String(process.env.HOST) + "/slack/callback",
	};

	await app.client.oauth.v2
		.access(data)
		.then(async (result) => {
			console.log(result);
			if (
				result.ok &&
				result.access_token &&
				result.team &&
				result.team.id &&
				result.team.name
			) {
				const existingAppConfig = await AppConfig.findOne({
					slackTeamId: result.team.id,
				});

				if (!existingAppConfig) {
					const appConfig = AppConfig.create({
						slackAccessToken: result.access_token,
						slackTeamId: result.team.id,
						slackTeamName: result.team.name,
					});

					await appConfig.save();

					return res.send("Successfully installed the app");
				}
				throw new Error("Slack app already installed");
			}
			throw new Error("Variables not defined");
		})
		.catch((error) => {
			console.error(error);
			return res.send(error.messsage);
		});
});

(async () => {
	await createConnection();
	await app.start(Number(process.env.PORT));
	console.log(`⚡️ Slack Bolt app is running on port ${process.env.PORT}!`);
})();
