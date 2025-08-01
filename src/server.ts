import { Config } from "@app/model/config";
import { triggerHibiscusSync } from "@app/utils/hibiscus";
import { importTransactionsForAccount } from "@app/utils/import-transactions";
import { logger } from "@app/utils/logger";
import { startNotificationScheduler } from "@app/utils/scheduler";
import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import express from "express";
import xmlrpc from "express-xmlrpc";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod/v4";
import { sendNtfyNotification } from "./utils/ntfy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hibiscusContextSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

export function createServer(config: Config) {
  const app = express();

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  // Start notification scheduler
  startNotificationScheduler(config);

  // Endpoint for manual sync trigger from ntfy notification
  app.get("/sync", async (_, res: Response) => {
    try {
      logger.info("Sync triggered via ntfy");
      await triggerHibiscusSync(config);
      res.sendFile(path.join(__dirname, "views", "sync-success.html"));
    } catch (error) {
      logger.error("Failed to handle sync request: %s", error);
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
        logger.error("Failed to parse context JSON: %s", error);
        res.status(400).json({ error: "Invalid context JSON" });
        return;
      }

      const result = hibiscusContextSchema.safeParse(contextData);
      if (!result.success) {
        logger.error("Invalid context data: %s", result.error);
        res.status(400).json({ error: "Invalid context data" });
        return;
      }

      const hibiscusAccountId = result.data.id;
      logger.info(`Received webhook for Hibiscus account ${hibiscusAccountId}`);

      // Process transactions asynchronously to avoid blocking the response
      importTransactionsForAccount(config, hibiscusAccountId).catch((error) => {
        logger.error("Failed to import transactions: %s", error);
      });

      // Return success immediately since we're processing asynchronously
      res.json({ message: "Processing transactions" });
    } catch (error) {
      logger.error("Webhook error: %s", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const tanRequests: Map<string, { challenge: { text: string; type: string; payload: string }; res: Response }> =
    new Map();

  app.use("/xmlrpc", xmlrpc.bodyParser);
  app.post(
    "/xmlrpc",
    xmlrpc.apiHandler({
      "hibiscus.getTan": async (req: Request, res: Response) => {
        const id = randomUUID();
        let [text, accountId, type, payload] = req.body.params;
        logger.info(`Received Tan request for account ${accountId} from Hibiscus (UUID: ${id})`);
        try {
          await sendNtfyNotification(config, {
            title: "Hibiscus TAN Request",
            message: "Hibiscus needs your TAN to synchronize transactions",
            tags: ["bank"],
            actions: [
              {
                type: "view",
                label: "Enter TAN",
                url: `${config.server.publicUrl}/tan-challenge/${id}`,
              },
            ],
          });
          tanRequests.set(id, { challenge: { text, type, payload }, res });
          setTimeout(
            () => {
              if (tanRequests.has(id)) {
                logger.error("TAN request timed out for ID: %s", id);
                tanRequests.delete(id);
              }
            },
            10 * 60 * 1000,
          );
        } catch (error) {
          logger.error("Failed to send ntfy notification: %s", error);
          res.status(500).json({ error: "Failed to send notification" });
          return;
        }
      },
    }),
  );

  app.get("/tan-challenge/:id", (req: Request, res: Response) => {
    const id = req.params.id;
    const tanRequest = tanRequests.get(id);
    if (!tanRequest) {
      logger.error("No TAN request found for ID: %s", id);
      res.status(404).json({ error: "TAN request not found" });
      return;
    }
    res.status(200).render("tan-challenge", tanRequest.challenge);
    return;
  });
  app.post("/tan-challenge/:id", (req: Request, res: Response) => {
    const id = req.params.id;
    const tanRequest = tanRequests.get(id);
    if (!tanRequest) {
      logger.error("No TAN request found for ID: %s", id);
      res.status(404).json({ error: "TAN request not found" });
      return;
    }
    tanRequest.res.send(xmlrpc.serializeResponse(req.body.tan));
    tanRequests.delete(id);
    logger.info("TAN request completed for ID: %s", id);
    res.status(200).sendFile(path.join(__dirname, "views", "tan-success.html"));
    return;
  });

  app.use("/static", express.static(path.join(__dirname, "static")));

  return app;
}
