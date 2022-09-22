import "reflect-metadata";
import { App, ExpressReceiver } from "@slack/bolt";
import { AppConfig } from "./entities/appConfig";
import dayjs from "dayjs";
import path from "path";
import express from "express";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { engine } from "express-handlebars";
import { authorizeFn } from "./controllers/auth";
import { getAuditLogs } from "./controllers/cloudflare";
import { checkLatestCloudflareLogs } from "./cron";
import { AppDataSource } from "./data-source";

const expressReceiver = new ExpressReceiver({
	signingSecret: String(process.env.SLACK_SIGNING_SECRET),
});

const expressRouter = expressReceiver.router;

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: process.env.NODE_ENV,
	integrations: [
		// enable HTTP calls tracing
		new Sentry.Integrations.Http({ tracing: true }),
		// enable Express.js middleware tracing
		new Tracing.Integrations.Express({ app: expressRouter }),
	],

	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 0.1,
});

const app = new App({
	// token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	authorize: authorizeFn,
	// socketMode:true, // enable the following to use socket mode
	// appToken: process.env.SLACK_APP_TOKEN,
	receiver: expressReceiver,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
expressRouter.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
expressRouter.use(Sentry.Handlers.tracingHandler());

expressReceiver.app.set("views", path.join(__dirname, "views"));
expressReceiver.app.set("view engine", "handlebars");
expressRouter.use(express.static(path.join(__dirname, "public")));
expressReceiver.app.engine("handlebars", engine());

expressRouter.get("/", (_, res) => {
	console.log("Rendering home");
	res.render("home", { title: "Home" });
});

expressRouter.get("/cron", async (_, res) => {
	try {
		await checkLatestCloudflareLogs(app);
		res.json({ success: true });
	} catch (error) {
		res.json({ success: false });
	}
});

expressRouter.get("/install", (_, res) => {
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

const commandPrefix =
	(process.env.NODE_ENV || "development").toLowerCase() === "production"
		? ""
		: "dev_";

app.command(
	`/${commandPrefix}cloudflarewatcher`,
	async ({ command, ack, say }) => {
		try {
			await ack();
			const [cloudflareOrgId, cloudflareAuthEmail, cloudflareAuthKey] =
				command.text.split(" ");

			const appConfigRepository = AppDataSource.getRepository(AppConfig);
			const existingAppConfig = await appConfigRepository.findOne({
				where: {
					slackTeamId: command.team_id,
				},
			});

			if (!existingAppConfig) {
				await say("Error: Slack app not configured with Watcher!");
				return;
			}

			getAuditLogs(
				{
					authEmail: cloudflareAuthEmail,
					authKey: cloudflareAuthKey,
				},
				{
					since: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
					before: dayjs().format("YYYY-MM-DD"),
					orgId: cloudflareOrgId,
				}
			)
				.then(async (cloudFlareResponse) => {
					console.log(cloudFlareResponse.data);

					existingAppConfig.cloudflareAuthEmail = cloudflareAuthEmail;
					existingAppConfig.cloudflareAuthKey = cloudflareAuthKey;
					existingAppConfig.cloudflareSlackChannelId =
						command.channel_id;
					existingAppConfig.cloudflareLastCheckedAt =
						dayjs().toDate();
					existingAppConfig.cloudflareOrgId = cloudflareOrgId;
					await AppDataSource.manager.save(existingAppConfig);

					await say(
						"Yaaay! You will get new Cloudflare changes in this channel!"
					);
					return;
				})
				.catch(async () => {
					await say(
						"Error: Invalid data provided. Get Global API Key from https://dash.cloudflare.com/profile/api-tokens."
					);
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
			text: "I am dumb, not sure why you are sending message to me!",
		});
	} catch (error) {
		console.log("err");
		console.error(error);
	}
});

expressRouter.get("/slack/callback", async (req, res) => {
	const data = {
		client_id: String(process.env.SLACK_CLIENT_ID),
		client_secret: String(process.env.SLACK_CLIENT_SECRET),
		code: String(req.query.code),
		redirect_uri: String(process.env.HOST) + "/slack/callback",
	};

	const appConfigRepository = AppDataSource.getRepository(AppConfig);

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
				const existingAppConfig = await appConfigRepository.findOne({
					where: {
						slackTeamId: result.team.id,
					},
				});

				if (!existingAppConfig) {
					const appConfig = new AppConfig();
					(appConfig.slackAccessToken = result.access_token),
						(appConfig.slackTeamId = result.team.id);
					appConfig.slackTeamName = result.team.name;

					await AppDataSource.manager.save(appConfig);

					return res.render("installSuccess", {
						title: "Installation Successful",
					});
				}
				throw new Error("Slack app already installed");
			}
			throw new Error("Variables not defined");
		})
		.catch((error) => {
			console.error(error);
			Sentry.captureException(error);
			return res.render("installError", {
				description:
					error.messsage ||
					"Failed to install bot for your Slack workspace, please try again",
				title: "Installation Failed",
			});
		});
});

expressRouter.get("/debug-sentry", () => {
	throw new Error("My first Sentry error!");
});

expressRouter.use(Sentry.Handlers.errorHandler());

(async () => {
	try {
		await AppDataSource.initialize();
		await app.start(Number(process.env.PORT));
		console.log(`⚡️ Slack app is running on port ${process.env.PORT}!`);
	} catch (error: any) {
		console.log(`Failed to start server, reason is ${error.message}!`);
	}
})();
