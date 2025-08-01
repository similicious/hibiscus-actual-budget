import { Config } from "@app/model/config";
import { HibiscusTransaction, hibiscusTransactionSchema } from "@app/model/hibiscus-transaction";
import { logger } from "@app/utils/logger";

import fetch from "node-fetch";
import { z } from "zod";

// Trigger sync for all accounts in Hibiscus
export async function triggerHibiscusSync(config: Config): Promise<void> {
  try {
    const url = new URL("/hibiscus/", config.hibiscus.url).toString();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: createBasicAuth(config.hibiscus.username, config.hibiscus.password),
      },
      body: new URLSearchParams({
        action: "execute",
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger sync: ${response.statusText}`);
    }

    logger.info("Successfully triggered Hibiscus sync");
  } catch (error) {
    logger.error("Failed to trigger Hibiscus sync: %s", error);
    throw new Error("Failed to trigger Hibiscus sync");
  }
}

// Create basic auth header
function createBasicAuth(username: string, password: string): string {
  return "Basic " + Buffer.from(username + ":" + password).toString("base64");
}
// Construct the Hibiscus endpoint URL for an account
function constructHibiscusEndpoint(hibiscusAccountId: number, fetchDaysAmount: number): string {
  return `/webadmin/rest/hibiscus/konto/${hibiscusAccountId}/umsaetze/days/${fetchDaysAmount}`;
}

// Fetch and validate transactions from Hibiscus API
export async function fetchHibiscusTransactions(
  config: Config,
  hibiscusAccountId: number,
  fetchDaysAmount: number,
): Promise<HibiscusTransaction[]> {
  try {
    const endpoint = constructHibiscusEndpoint(hibiscusAccountId, fetchDaysAmount);
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
    logger.error("Failed to fetch Hibiscus transactions: %s", error);
    throw new Error("Failed to fetch Hibiscus transactions");
  }
}
