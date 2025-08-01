import { Config } from "@app/model/config";
import { sendNtfyNotification } from "./ntfy";
import { Telegram } from "./telegram";

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
    const telegram = Telegram.get(config);
    return telegram.sendNotification.bind(telegram);
  } else {
    throw new Error("No notification method configured");
  }
}

export async function sendNotification(config: Config, notification: SyncNotification) {
  const notifier: Notifier = getNotifier(config);
  await notifier(config, notification);
}
