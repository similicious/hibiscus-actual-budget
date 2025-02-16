interface EnvVars {
  HIBISCUS_URL: string;
  HIBISCUS_USERNAME: string;
  HIBISCUS_PASSWORD: string;
  ACTUAL_SERVER_URL: string;
  ACTUAL_SYNC_ID: string;
  ACTUAL_PASSWORD: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvVars {}
  }
}

export {};
