import { Config } from "@app/model/config";
import { triggerHibiscusSync } from "@app/utils/hibiscus";
import { importTransactionsForAccount } from "@app/utils/import-transactions";
import { logger } from "@app/utils/logger";
import { startNotificationScheduler } from "@app/utils/scheduler";
import express from "express";
import { z } from "zod";

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
  app.get("/sync", async (req: express.Request, res: express.Response) => {
    try {
      logger.info("Sync triggered via ntfy");
      await triggerHibiscusSync(config);
      res.send(`
        <html>
          <head>
            <title>Hibiscus Sync</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                text-align: center;
              }
              h1 { color:#1a252f; }
              .message { 
                background: #e8f5e9;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              button {
                background-color: #2c3e50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
              }
              button:hover {
                background-color: #1a252f;
              }
              svg {
                width: 25%;
              }
            </style>
          </head>
          <body>
            <h1>Hibiscus Sync</h1>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" enable-background="new 0 0 64 64"><path d="M32,2C15.431,2,2,15.432,2,32c0,16.568,13.432,30,30,30c16.568,0,30-13.432,30-30C62,15.432,48.568,2,32,2z M25.025,50  l-0.02-0.02L24.988,50L11,35.6l7.029-7.164l6.977,7.184l21-21.619L53,21.199L25.025,50z" fill="#36a53f"/></svg>
            <div class="message">
              Sync request sent to Hibiscus. Please check your banking app for authorization.
            </div>
            <button onclick="window.close()">Close Tab</button>
          </body>
        </html>
      `);
    } catch (error) {
      logger.error("Failed to handle sync request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
