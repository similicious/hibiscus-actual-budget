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
export async function fetchHibiscusTransactions(config: Config): Promise<HibiscusTransaction[]> {
  try {
    const response = await fetch(config.hibiscusUrl, {
      headers: {
        Accept: "application/json",
        Authorization: createBasicAuth(config.hibiscusUsername, config.hibiscusPassword),
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
