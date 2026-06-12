import { Config, configSchema } from "@app/model/config";
import { logger } from "@app/utils/logger";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateDeprecatedConfig(configJson: unknown): unknown {
  if (!isRecord(configJson)) {
    return configJson;
  }

  const ntfyConfig = configJson.ntfy;
  if (!isRecord(ntfyConfig) || typeof ntfyConfig.schedule !== "string") {
    return configJson;
  }

  const shouldUseDeprecatedSchedule = configJson.notificationSchedule === undefined;
  logger.warn(
    `Config property ntfy.schedule is deprecated and will be removed in a future release. ${
      shouldUseDeprecatedSchedule
        ? "Using it as notificationSchedule for now."
        : "Please remove it and use notificationSchedule instead."
    }`,
  );

  const migratedConfig: Record<string, unknown> = {
    ...configJson,
    ...(shouldUseDeprecatedSchedule ? { notificationSchedule: ntfyConfig.schedule } : {}),
  };

  if (Object.keys(ntfyConfig).every((key) => key === "schedule")) {
    delete migratedConfig.ntfy;
  }

  return migratedConfig;
}

export function loadConfig(): Config {
  try {
    const configPath = join(__dirname, "..", "config", "config.json");
    const configFile = readFileSync(configPath, "utf-8");
    const configJson = migrateDeprecatedConfig(JSON.parse(configFile));

    // Validate configuration
    const config = configSchema.parse(configJson);

    return config;
  } catch (error) {
    logger.error("Failed to load configuration: %s", error as Error);
    throw error;
  }
}
