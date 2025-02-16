import api from "@actual-app/api";
import { loadConfig } from "@app/config";
import { fetchHibiscusTransactions } from "@app/utils/hibiscus";
import { logger } from "@app/utils/logger";
import { mapToActualTransaction } from "@app/utils/transactions";

async function main() {
  try {
    logger.info("Loading configuration");
    const config = loadConfig();

    logger.info("Initializing Actual Budget");
    await api.init({
      dataDir: config.dataDir,
      serverURL: config.actualServerUrl,
      password: config.actualPassword,
    });

    logger.info("Downloading budget");
    await api.downloadBudget(config.actualSyncId);

    logger.info("Getting account list");
    const accounts = await api.getAccounts();
    const dkbAccount = accounts.find((a) => a.name === "DKB");
    if (!dkbAccount) {
      throw new Error('Account "DKB" not found in Actual Budget');
    }

    logger.info("Fetching transactions from Hibiscus");
    const hibiscusTransactions = await fetchHibiscusTransactions(config);
    logger.info(`Found ${hibiscusTransactions.length} transactions`);

    if (hibiscusTransactions.length === 0) {
      logger.info("No transactions to import");
      return;
    }

    logger.info("Converting transactions");
    const actualTransactions = hibiscusTransactions.map(mapToActualTransaction);

    logger.info("Importing transactions");
    const result = await api.importTransactions(dkbAccount.id, actualTransactions);

    logger.info(
      `Import Summary: \n- Added: ${result.added.length} transactions\n- Updated: ${result.updated.length} transactions`,
    );

    if (result.errors && result.errors.length > 0) {
      logger.error(`- Errors: ${result.errors.length}`);
      result.errors.forEach((error) => logger.error(`${error}`));
    }
  } finally {
    logger.info("Shutting down");
    await api.shutdown();
  }
}

// Run the script
main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
