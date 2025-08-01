import { Config } from "@app/model/config";
import { logger } from "@app/utils/logger";
import { Bot } from "grammy";
import { SyncNotification } from "./notifications";

export class Telegram {
  private static _instance: Telegram;
  private bot: Bot;

  private constructor(config: Config) {
    if (!config.telegram) {
      throw new Error("Telegram configuration is not set");
    }
    this.bot = new Bot(config.telegram.token);
    this.bot.on("message", (ctx) => {
      ctx.reply(`Chat ID: ${ctx.chat.id}`);
    });
    this.bot.start();
  }

  public static get(config: Config): Telegram {
    if (!this._instance) {
      this._instance = new Telegram(config);
    }
    return this._instance;
  }

  public async sendNotification(config: Config, notification: SyncNotification) {
    if (!config.telegram) {
      throw new Error("Telegram configuration is not set");
    }
    if (!config.telegram.chatId) {
      throw new Error("Telegram chat ID is not set");
    }

    let message = `*${notification.title}*\n\n${notification.message}`;
    if (notification.link) {
      message += `\n\n[${notification.link.label}](${notification.link.url})`;
    }

    try {
      await this.bot.api.sendMessage(config.telegram.chatId, message, { parse_mode: "MarkdownV2" });
      logger.info("Telegram notification sent successfully");
    } catch (error) {
      logger.error("Failed to send Telegram notification: %s", error);
      throw new Error("Failed to send Telegram notification");
    }
  }
}
