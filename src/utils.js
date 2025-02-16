import fetch from "node-fetch";

// Convert Hibiscus transaction to Actual Budget format
export function convertTransaction(hibiscusTx) {
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
function formatNotes(tx) {
  const details = [
    `Type: ${tx.art}`,
    `Note: ${[tx.zweck, tx.zweck2, tx.zweck3].filter(Boolean).join(" ")}`,
    `Id: ${tx.id}`,
  ];

  return details.join(" | ");
}

// Create basic auth header
function createBasicAuth(username, password) {
  return "Basic " + Buffer.from(username + ":" + password).toString("base64");
}

// Fetch transactions from Hibiscus API
export async function fetchHibiscusTransactions(config) {
  try {
    const fetchOptions = {
      headers: {
        Accept: "application/json",
        Authorization: createBasicAuth(
          config.hibiscusUsername,
          config.hibiscusPassword
        ),
      },
    };

    const response = await fetch(config.hibiscusUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const transactions = await response.json();
    return Array.isArray(transactions) ? transactions : [];
  } catch (error) {
    throw new Error(`Failed to fetch Hibiscus transactions: ${error.message}`);
  }
}
