import { Config } from "@app/model/config";
import { triggerHibiscusSync } from "@app/utils/hibiscus";
import { importTransactionsForAccount } from "@app/utils/import-transactions";
import { logger } from "@app/utils/logger";
import { startNotificationScheduler } from "@app/utils/scheduler";
import type { Request, Response } from "express";
import express from "express";
import xmlrpc from "express-xmlrpc";
import path from "path";
import { tinyws } from "tinyws";
import { fileURLToPath } from "url";
import { z } from "zod";

declare global {
  namespace Express {
    export interface Request {
      ws: () => Promise<WebSocket>;
    }
  }
}

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

  const clients: WebSocket[] = [];
  let hibiscusResponse: express.Response | undefined = undefined;
  app.use("/ws", tinyws(), async (req, res) => {
    if (!req.ws) {
      return res.status(400).send("WebSocket required");
    }
    const ws = await req.ws();
    clients.push(ws);

    ws.onclose = () => {
      clients.splice(clients.indexOf(ws), 1);
    };
    ws.onmessage = (event) => {
      const message = event.data;
      logger.info("Received TAN from WebSocket client: %s", message);
      if (hibiscusResponse) {
        hibiscusResponse.send(xmlrpc.serializeResponse(message));
        hibiscusResponse = undefined;
      }
    };
  });

  app.use("/xmlrpc", xmlrpc.bodyParser);
  app.post(
    "/xmlrpc",
    xmlrpc.apiHandler({
      "hibiscus.getTan": async (req: express.Request, res: express.Response) => {
        logger.info("Received Tan request from Hibiscus");
        let [text, id, type, payload] = req.body.params;
        hibiscusResponse = res;
        clients.forEach((client) => {
          client.send(JSON.stringify({ text, id, type, payload }));
        });
      },
    }),
  );

  return app;
}
