import { Config } from "@app/model/config";
import "dotenv/config";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadConfig(): Config {
  const requiredVars = [
    "HIBISCUS_URL",
    "HIBISCUS_USERNAME",
    "HIBISCUS_PASSWORD",
    "ACTUAL_SERVER_URL",
    "ACTUAL_SYNC_ID",
    "ACTUAL_PASSWORD",
  ] as const;

  // Validate required environment variables
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const dataDir = join(__dirname, "..", "data");

  // Create data directory if it doesn't exist
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
  }

  return {
    hibiscusUrl: process.env.HIBISCUS_URL,
    hibiscusUsername: process.env.HIBISCUS_USERNAME,
    hibiscusPassword: process.env.HIBISCUS_PASSWORD,
    actualServerUrl: process.env.ACTUAL_SERVER_URL,
    actualPassword: process.env.ACTUAL_PASSWORD,
    actualSyncId: process.env.ACTUAL_SYNC_ID,
    dataDir,
  };
}
