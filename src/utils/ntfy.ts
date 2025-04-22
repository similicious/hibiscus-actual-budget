import { Config } from "@app/model/config";
import { logger } from "@app/utils/logger";
import fetch from "node-fetch";

interface NtfyNotificationOptions {
  title: string;
  message: string;
  tags?: string[];
  actions?: { label: string; type: string; url: string }[];
}

export async function sendNtfyNotification(config: Config, options: NtfyNotificationOptions) {
  try {
    const url = `https://ntfy.sh/${config.ntfy.topic}`;

    const headers: Record<string, string> = {
      Title: options.title,
    };

    if (options.tags && options.tags.length > 0) {
      headers.Tags = options.tags.join(",");
    }

    if (options.actions && options.actions.length > 0) {
      headers.Actions = options.actions.map((action) => `${action.type}, ${action.label}, ${action.url}`).join(";");
    }

    await fetch(url, {
      method: "POST",
      headers,
      body: options.message,
    });

    logger.info("Sent ntfy notification: %s", options.title);
  } catch (error) {
    logger.error("Failed to send ntfy notification: %s", error);
    throw new Error("Failed to send ntfy notification");
  }
}
