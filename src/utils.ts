import { Config } from "@app/model/config";
import { CreateActualTransaction } from "@app/model/create-actual-transaction";
import { HibiscusTransaction } from "@app/model/hibiscus-transaction";
import fetch from "node-fetch";

// Convert Hibiscus transaction to Actual Budget format
export function convertTransaction(hibiscusTx: HibiscusTransaction): CreateActualTransaction {
  return {
    date: hibiscusTx.datum,
    amount: Math.round(parseFloat(hibiscusTx.betrag) * 100),
    payee_name: hibiscusTx.empfaenger_name,
    imported_payee: hibiscusTx.empfaenger_name,
    notes: formatNotes(hibiscusTx),
    imported_id: hibiscusTx.checksum,
    cleared: true,
  };
}

// Format transaction notes with additional details
function formatNotes(tx: HibiscusTransaction): string {
  const details = [
    `Type: ${tx.art}`,
    `Note: ${[tx.zweck, tx.zweck2, tx.zweck3].filter(Boolean).join(" ")}`,
    `Id: ${tx.id}`,
  ];

  return details.join(" | ");
}

// Create basic auth header
function createBasicAuth(username: string, password: string): string {
  return "Basic " + Buffer.from(username + ":" + password).toString("base64");
}

// Fetch transactions from Hibiscus API
export async function fetchHibiscusTransactions(config: Config): Promise<HibiscusTransaction[]> {
  try {
    const response = await fetch(config.hibiscusUrl, {
      headers: {
        Accept: "application/json",
        Authorization: createBasicAuth(config.hibiscusUsername, config.hibiscusPassword),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const transactions = await response.json();
    return Array.isArray(transactions) ? transactions : [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Hibiscus transactions: ${error.message}`);
    }
    throw new Error("Failed to fetch Hibiscus transactions: Unknown error");
  }
}
