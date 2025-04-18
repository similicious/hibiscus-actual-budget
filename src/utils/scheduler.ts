import { Config } from "@app/model/config";
import { logger } from "@app/utils/logger";
import cron from "node-cron";
import { sendNotification } from "./notifications";

export function startNotificationScheduler(config: Config) {
  try {
    logger.info(`Starting notification scheduler with schedule: ${config.notificationSchedule}`);

    cron.schedule(config.notificationSchedule, () => {
      sendNotification(config, {
        title: "Hibiscus Sync Reminder",
        message: "Time to sync your bank transactions",
        link: {
          label: "Sync Now",
          url: `${config.server.publicUrl}/sync`,
        },
      }).catch((error) => {
        logger.error("Failed to send scheduled notification: %s", error);
      });
    });
  } catch (error) {
    logger.error("Failed to start notification scheduler: %s", error);
    throw error;
  }
}
