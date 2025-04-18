import { Config } from "@app/model/config";
import { triggerHibiscusSync } from "@app/utils/hibiscus";
import { importTransactionsForAccount } from "@app/utils/import-transactions";
import { logger } from "@app/utils/logger";
import { startNotificationScheduler } from "@app/utils/scheduler";
import type { Request, Response } from "express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hibiscusContextSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

export function createServer(config: Config) {
  const app = express();

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));

  // Start notification scheduler
  startNotificationScheduler(config);

  // Endpoint for manual sync trigger from ntfy notification
  app.get("/sync", async (_, res: Response) => {
    try {
      logger.info("Sync triggered via ntfy");
      await triggerHibiscusSync(config);
      res.sendFile(path.join(__dirname, "views", "sync-success.html"));
    } catch (error) {
      logger.error("Failed to handle sync request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/webhook", async (req: Request, res: Response) => {
    try {
      const contextStr = req.body.context;
      if (!contextStr) {
        logger.error("No context provided in webhook request");
        res.status(400).json({ error: "No context provided" });
        return;
      }

      let contextData;
      try {
        contextData = JSON.parse(contextStr);
      } catch (error) {
        logger.error("Failed to parse context JSON", error);
        res.status(400).json({ error: "Invalid context JSON" });
        return;
      }

      const result = hibiscusContextSchema.safeParse(contextData);
      if (!result.success) {
        logger.error("Invalid context data", result.error);
        res.status(400).json({ error: "Invalid context data" });
        return;
      }

      const hibiscusAccountId = result.data.id;
      logger.info(`Received webhook for Hibiscus account ${hibiscusAccountId}`);

      // Process transactions asynchronously to avoid blocking the response
      importTransactionsForAccount(config, hibiscusAccountId).catch((error) => {
        logger.error("Failed to import transactions", error);
      });

      // Return success immediately since we're processing asynchronously
      res.json({ message: "Processing transactions" });
    } catch (error) {
      logger.error("Webhook error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app;
}
