import { Config } from "@app/model/config";
import { importTransactionsForAccount } from "@app/utils/import-transactions";
import { logger } from "@app/utils/logger";
import express from "express";
import { z } from "zod";

const hibiscusContextSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

export function createServer(config: Config) {
  const app = express();

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));

  app.post("/webhook", async (req: express.Request, res: express.Response) => {
    try {
      const contextStr = req.body.context;
      if (!contextStr) {
        logger.error("No context provided in webhook request");
        return res.status(400).json({ error: "No context provided" });
      }

      let contextData;
      try {
        contextData = JSON.parse(contextStr);
      } catch (error) {
        logger.error("Failed to parse context JSON", error);
        return res.status(400).json({ error: "Invalid context JSON" });
      }

      const result = hibiscusContextSchema.safeParse(contextData);
      if (!result.success) {
        logger.error("Invalid context data", result.error);
        return res.status(400).json({ error: "Invalid context data" });
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
