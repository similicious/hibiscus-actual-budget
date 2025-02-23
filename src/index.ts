import { loadConfig } from "@app/config";
import { createServer } from "@app/server";
import { logger } from "@app/utils/logger";

logger.info("Loading configuration");
const config = loadConfig();

const app = createServer(config);

const port = config.server.port;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  logger.info("Waiting for Hibiscus webhook calls...");
});
