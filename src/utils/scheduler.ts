import { Config } from "@app/model/config";
import { logger } from "@app/utils/logger";
import { sendNtfyNotification } from "@app/utils/ntfy";
import cron from "node-cron";

export function startNotificationScheduler(config: Config) {
  try {
    logger.info(`Starting notification scheduler with schedule: ${config.ntfy.schedule}`);

    cron.schedule(config.ntfy.schedule, () => {
      sendNtfyNotification(config, {
        title: "Hibiscus Sync Reminder",
        message: "Time to sync your bank transactions",
        tags: ["bank"],
        actions: [
          {
            type: "view",
            label: "Sync Now",
            url: `${config.server.publicUrl}/sync`,
          },
        ],
      }).catch((error) => {
        logger.error("Failed to send scheduled notification", error);
      });
    });
  } catch (error) {
    logger.error("Failed to start notification scheduler", error);
    throw error;
  }
}
