import { Config } from "@app/model/config";
import { envSchema } from "@app/model/env";
import { logger } from "@app/utils/logger";
import "dotenv/config";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadConfig(): Config {
  try {
    // Validate environment variables
    const env = envSchema.parse(process.env);

    const dataDir = join(__dirname, "..", "data");

    // Create data directory if it doesn't exist
    if (!existsSync(dataDir)) {
      logger.info("Creating data directory", { path: dataDir });
      mkdirSync(dataDir);
    }

    const config = {
      hibiscusUrl: env.HIBISCUS_URL,
      hibiscusUsername: env.HIBISCUS_USERNAME,
      hibiscusPassword: env.HIBISCUS_PASSWORD,
      actualServerUrl: env.ACTUAL_SERVER_URL,
      actualPassword: env.ACTUAL_PASSWORD,
      actualSyncId: env.ACTUAL_SYNC_ID,
      dataDir,
    };

    logger.debug("Config loaded successfully", { config: { ...config, hibiscusPassword: "[REDACTED]" } });
    return config;
  } catch (error) {
    logger.error("Failed to load configuration", error as Error);
    throw error;
  }
}
