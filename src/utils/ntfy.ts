import { Config } from "@app/model/config";
import { logger } from "@app/utils/logger";
import fetch from "node-fetch";

export async function sendNtfyNotification(config: Config) {
  try {
    const url = `https://ntfy.sh/${config.ntfy.topic}`;
    const syncUrl = `${config.server.publicUrl}/sync`;

    await fetch(url, {
      method: "POST",
      headers: {
        Title: "Hibiscus Sync Reminder",
        Tags: "bank",
        Actions: `view, Sync Now, ${syncUrl}`,
      },
      body: "Time to sync your bank transactions",
    });

    logger.info("Sent ntfy notification");
  } catch (error) {
    logger.error("Failed to send ntfy notification", error);
    throw new Error("Failed to send ntfy notification");
  }
}
