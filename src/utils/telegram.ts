import { Config } from "@app/model/config";
import { logger } from "@app/utils/logger";
import fetch from "node-fetch";
import { SyncNotification } from "./notifications";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendTelegramNotification(config: Config, notification: SyncNotification) {
  if (!config.telegram) {
    throw new Error("Telegram configuration is not set");
  }

  const url = `https://api.telegram.org/bot${config.telegram.token}/sendMessage`;
  const message = [escapeHtml(notification.title), escapeHtml(notification.message)].filter(Boolean).join("\n\n");
  const fallbackMessage = [
    message,
    notification.link
      ? `Copy and paste this URL into your browser:\n<code>${escapeHtml(notification.link.url)}</code>`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");

  const payload = {
    chat_id: config.telegram.chatId,
    text: message,
    parse_mode: "HTML",
    ...(notification.link && {
      // Telegram is picky about which URLs are accepted for buttons, so fall back to copy-paste text on errors.
      reply_markup: {
        inline_keyboard: [[{ text: notification.link.label, url: notification.link.url }]],
      },
    }),
  };
  const fallbackPayload = {
    chat_id: config.telegram.chatId,
    text: fallbackMessage,
    parse_mode: "HTML",
  };

  try {
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok && notification.link) {
      const body = await response.text();
      logger.warn("Telegram rejected notification button, retrying with copy-paste URL: %s", body);
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallbackPayload),
      });
    }

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
