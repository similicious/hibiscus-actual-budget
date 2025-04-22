import { Config, configSchema } from "@app/model/config";
import { logger } from "@app/utils/logger";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadConfig(): Config {
  try {
    const configPath = join(__dirname, "..", "config", "config.json");
    const configFile = readFileSync(configPath, "utf-8");
    const configJson = JSON.parse(configFile);

    // Validate configuration
    const config = configSchema.parse(configJson);

    return config;
  } catch (error) {
    logger.error("Failed to load configuration: %s", error as Error);
    throw error;
  }
}
