import { Config } from "@app/model/config";
import { HibiscusTransaction, hibiscusTransactionSchema } from "@app/model/hibiscus-transaction";
import { logger } from "@app/utils/logger";

import fetch, { Response } from "node-fetch";

// Create basic auth header
function createBasicAuth(username: string, password: string): string {
  return "Basic " + Buffer.from(username + ":" + password).toString("base64");
}

// Handle HTTP response
async function handleResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("HTTP request failed", undefined, {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
  }

  try {
    return await response.json();
  } catch (error) {
    logger.error("Failed to parse response JSON", error as Error);
    throw new Error("Invalid JSON response from server");
  }
}

// Fetch and validate transactions from Hibiscus API
export async function fetchHibiscusTransactions(config: Config): Promise<HibiscusTransaction[]> {
  try {
    const response = await fetch(config.hibiscusUrl, {
      headers: {
        Accept: "application/json",
        Authorization: createBasicAuth(config.hibiscusUsername, config.hibiscusPassword),
      },
    });

    const data = await handleResponse(response);

    if (!Array.isArray(data)) {
      logger.error("Invalid response format", undefined, { data });
      throw new Error("Expected array of transactions but received different format");
    }

    // Validate each transaction
    const validatedTransactions = data.map((tx, index) => {
      try {
        return validateHibiscusTransaction(tx);
      } catch (error) {
        logger.warn("Skipping invalid transaction", { index, transaction: tx, error });
        return null;
      }
    });

    // Filter out invalid transactions
    const transactions = validatedTransactions.filter((tx): tx is HibiscusTransaction => tx !== null);

    logger.info("Successfully fetched transactions", {
      total: data.length,
      valid: transactions.length,
      invalid: data.length - transactions.length,
    });

    return transactions;
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Failed to fetch Hibiscus transactions", error);
      throw new Error(`Failed to fetch Hibiscus transactions: ${error.message}`);
    }
    throw error;
  }
}

export function validateHibiscusTransaction(transaction: any): HibiscusTransaction {
  try {
    return hibiscusTransactionSchema.parse(transaction);
  } catch (error) {
    logger.error("Transaction validation failed", error as Error, { transaction });
    throw error;
  }
}
