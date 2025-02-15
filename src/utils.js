const fetch = require("node-fetch");

// Convert Hibiscus transaction to Actual Budget format
function convertTransaction(hibiscusTx) {
  return {
    date: hibiscusTx.datum,
    amount: Math.round(parseFloat(hibiscusTx.betrag) * 100),
    payee_name: hibiscusTx.empfaenger_name,
    imported_payee: hibiscusTx.zweck,
    notes: formatNotes(hibiscusTx),
    imported_id: hibiscusTx.txid,
    cleared: true,
  };
}

// Format transaction notes with additional details
function formatNotes(tx) {
  const details = [
    `Purpose: ${tx.zweck}`,
    `IBAN: ${tx.empfaenger_konto}`,
    `BIC: ${tx.empfaenger_blz}`,
    `Type: ${tx.art}`,
  ];

  if (tx.endtoendid) {
    details.push(`End-to-End ID: ${tx.endtoendid}`);
  }

  return details.join("\n");
}

// Create basic auth header
function createBasicAuth(username, password) {
  return "Basic " + Buffer.from(username + ":" + password).toString("base64");
}

// Fetch transactions from Hibiscus API
async function fetchHibiscusTransactions(config) {
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

module.exports = {
  convertTransaction,
  fetchHibiscusTransactions,
};
