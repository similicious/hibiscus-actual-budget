import { Config } from "@app/model/config";
import { sendNtfyNotification } from "@app/utils/ntfy";
import { sendTelegramNotification } from "@app/utils/telegram";

export interface SyncNotification {
  title: string;
  message: string;
  link?: { label: string; url: string };
}

export type Notifier = (config: Config, notification: SyncNotification) => Promise<void>;

function getNotifier(config: Config): Notifier {
  if (config.ntfy) {
    return sendNtfyNotification;
  } else if (config.telegram) {
    return sendTelegramNotification;
  } else {
    throw new Error("No notification method configured");
  }
}

export async function sendNotification(config: Config, notification: SyncNotification) {
  const notifier: Notifier = getNotifier(config);
  await notifier(config, notification);
}
