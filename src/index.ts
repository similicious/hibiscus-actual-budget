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
      serverURL: config.actual.serverUrl,
      password: config.actual.password,
      dataDir: config.dataDir,
    });

    for (const budget of config.budgets) {
      logger.info(`Processing budget with sync ID: ${budget.syncId}`);
      await api.downloadBudget(budget.syncId);

      logger.info("Getting account list");
      const accounts = await api.getAccounts();

      for (const accountMapping of budget.accounts) {
        const account = accounts.find((account) => account.id === accountMapping.accountId);
        if (!account) {
          logger.error(`Account ${accountMapping.accountId} not found in Actual Budget`);
          continue;
        }

        logger.info(`Fetching transactions for account: ${account.name}`);
        const hibiscusTransactions = await fetchHibiscusTransactions(config, accountMapping.hibiscusEndpoint);
        logger.info(`Found ${hibiscusTransactions.length} transactions`);

        if (hibiscusTransactions.length === 0) {
          logger.info("No transactions to import");
          continue;
        }

        logger.info("Converting transactions");
        const actualTransactions = hibiscusTransactions.map(mapToActualTransaction);

        logger.info("Importing transactions");
        const result = await api.importTransactions(account.id, actualTransactions);

        const actualBalance = await api.getAccountBalance(account.id);
        logger.info(`Account balance for ${account.name}: ${actualBalance}`);

        const hibiscusBalance = hibiscusTransactions.at(0)?.saldo ?? 0;
        logger.info(`Hibiscus balance for ${account.name}: ${hibiscusBalance}`);

        if (actualBalance === hibiscusBalance) {
          logger.info(`Hibiscus and Actual balances match 🎉`);
        }

        logger.info(
          `Import Summary for ${account.name}: \n- Added: ${result.added.length} transactions\n- Updated: ${result.updated.length} transactions`,
        );

        if (result.errors && result.errors.length > 0) {
          logger.error(`- Errors: ${result.errors.length}`);
          result.errors.forEach((error) => logger.error(`${error}`));
        }
      }
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
