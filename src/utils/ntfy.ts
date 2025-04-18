import { Config } from "@app/model/config";
import { logger } from "@app/utils/logger";
import fetch from "node-fetch";
import { SyncNotification } from "./notifications";

export async function sendNtfyNotification(config: Config, notification: SyncNotification) {
  try {
    if (!config.ntfy) {
      logger.error("Ntfy configuration is not set");
      return;
    }
    const url = `https://ntfy.sh/${config.ntfy.topic}`;

    const headers: Record<string, string> = {
      Title: notification.title,
    };

    headers.Tags = "bank";

    if (notification.link) {
      headers.Actions = `view, ${notification.link.label}, ${notification.link.url}`;
    }

    await fetch(url, {
      method: "POST",
      headers,
      body: notification.message,
    });

    logger.info("Sent ntfy notification: %s", notification.title);
  } catch (error) {
    logger.error("Failed to send ntfy notification: %s", error);
    throw new Error("Failed to send ntfy notification");
  }
}
