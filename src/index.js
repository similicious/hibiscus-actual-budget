import api from "@actual-app/api";
import { loadConfig } from "./config.js";
import { convertTransaction, fetchHibiscusTransactions } from "./utils.js";

async function main() {
  try {
    console.log("Loading configuration...");
    const config = loadConfig();

    console.log("Initializing Actual Budget...");
    await api.init({
      dataDir: config.dataDir,
      serverURL: config.actualServerUrl,
      password: config.actualPassword,
    });

    console.log("Downloading budget...");
    await api.downloadBudget(config.actualSyncId);

    console.log("Getting account list...");
    const accounts = await api.getAccounts();
    const dkbAccount = accounts.find((a) => a.name === "DKB");
    if (!dkbAccount) {
      throw new Error('Account "DKB" not found in Actual Budget');
    }

    console.log("Fetching transactions from Hibiscus...");
    const hibiscusTransactions = await fetchHibiscusTransactions(config);
    console.log(`Found ${hibiscusTransactions.length} transactions`);

    if (hibiscusTransactions.length === 0) {
      console.log("No transactions to import");
      return;
    }

    console.log("Converting transactions...");
    const actualTransactions = hibiscusTransactions.map(convertTransaction);

    console.log("Importing transactions...");
    const result = await api.importTransactions(
      dkbAccount.id,
      actualTransactions
    );

    console.log("\nImport Summary:");
    console.log(`- Added: ${result.added.length} transactions`);
    console.log(`- Updated: ${result.updated.length} transactions`);
    if (result.errors && result.errors.length > 0) {
      console.log(`- Errors: ${result.errors.length}`);
      result.errors.forEach((error) => console.error(`  - ${error}`));
    }
  } catch (error) {
    console.error("\nError:", error.message);
    if (error.meta || error.reason) {
      console.error("\nAdditional error details:");
      if (error.meta) console.error("Meta:", error.meta);
      if (error.reason) console.error("Reason:", error.reason);
    }
    process.exit(1);
  } finally {
    console.log("\nCleaning up...");
    await api.shutdown();
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
