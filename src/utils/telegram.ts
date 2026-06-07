import { Config } from "@app/model/config";
import { logger } from "@app/utils/logger";
import fetch from "node-fetch";
import { SyncNotification } from "./notifications";

export async function sendTelegramNotification(config: Config, notification: SyncNotification) {
  if (!config.telegram) {
    throw new Error("Telegram configuration is not set");
  }

  const url = `https://api.telegram.org/bot${config.telegram.token}/sendMessage`;
  const message = [
    notification.title,
    notification.message,
    notification.link ? `${notification.link.label}: ${notification.link.url}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.telegram.chatId,
        text: message,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram API returned ${response.status}: ${body}`);
    }

    logger.info("Telegram notification sent successfully");
  } catch (error) {
    logger.error("Failed to send Telegram notification: %s", error);
    throw new Error("Failed to send Telegram notification");
  }
}
