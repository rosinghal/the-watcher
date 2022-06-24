declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    CRYPT_KEY: string;
    HOST: string;
    PORT: string;
    SENTRY_DSN?: string;
    SLACK_CLIENT_ID: string;
    SLACK_CLIENT_SECRET: string;
    SLACK_SIGNING_SECRET: string;
    TYPEORM_ENTITIES: string;
    TYPEORM_LOGGING?: string;
    TYPEORM_MIGRATIONS_DIR: string;
    TYPEORM_MIGRATIONS: string;
    TYPEORM_SYNCHRONIZE?: string;
    TYPEORM_URL: string;
  }
}
