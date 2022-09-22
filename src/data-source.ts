import { DataSource } from "typeorm";
import { AppConfig } from "./entities/appConfig";

export const AppDataSource = new DataSource({
    type: 'postgres',
	url: process.env.TYPEORM_URL,
    entities: [AppConfig],
    migrations: [String(process.env.TYPEORM_MIGRATIONS)],
    logging: Boolean(process.env.TYPEORM_LOGGING),
    synchronize: Boolean(process.env.TYPEORM_SYNCHRONIZE),
});
