import { loadConfig } from "@app/config";
import { createServer } from "@app/server";
import { logger } from "@app/utils/logger";
import { Telegram } from "./utils/telegram";

logger.info("Loading configuration");
const config = loadConfig();

if (config.telegram) {
  // Start bot
  Telegram.get(config);
}

const app = createServer(config);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Validate port
if (isNaN(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  logger.info("Waiting for Hibiscus webhook calls...");
});
