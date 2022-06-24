import { DataSource } from "typeorm"

export default new DataSource({
    type: "postgres",
    url: process.env.TYPEORM_URL,
    migrations: (process.env.TYPEORM_MIGRATIONS ?? '').split(','),
    entities: (process.env.TYPEORM_ENTITIES ?? '').split(','),
    synchronize: Boolean(process.env.TYPEORM_SYNCHRONIZE),
    logging: Boolean(process.env.TYPEORM_LOGGING),
});
