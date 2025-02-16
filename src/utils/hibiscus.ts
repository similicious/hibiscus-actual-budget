import { Config } from "@app/model/config";
import { HibiscusTransaction, hibiscusTransactionSchema } from "@app/model/hibiscus-transaction";
import { logger } from "@app/utils/logger";

import fetch from "node-fetch";
import { z } from "zod";

// Create basic auth header
function createBasicAuth(username: string, password: string): string {
  return "Basic " + Buffer.from(username + ":" + password).toString("base64");
}
// Fetch and validate transactions from Hibiscus API
export async function fetchHibiscusTransactions(config: Config, endpoint: string): Promise<HibiscusTransaction[]> {
  try {
    const url = new URL(endpoint, config.hibiscus.url).toString();
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: createBasicAuth(config.hibiscus.username, config.hibiscus.password),
      },
    }).then((res) => res.json());

    // Validate transactions
    const transactions = z.array(hibiscusTransactionSchema).parse(response);

    return transactions;
  } catch (error) {
    logger.error("Failed to fetch Hibiscus transactions", error);
    throw new Error("Failed to fetch Hibiscus transactions");
  }
}
