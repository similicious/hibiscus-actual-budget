import api from "@actual-app/api";
import { Config } from "@app/model/config";
import { fetchHibiscusTransactions } from "@app/utils/hibiscus";
import { logger } from "@app/utils/logger";
import { mapToActualTransaction } from "@app/utils/transactions";

export async function importTransactionsForAccount(config: Config, hibiscusAccountId: number) {
  try {
    logger.info("Initializing Actual Budget");
    await api.init({
      serverURL: config.actual.serverUrl,
      password: config.actual.password,
      dataDir: config.dataDir,
    });

    // Find the budget and account mapping for this Hibiscus account
    const budgetMapping = config.budgets.find((budget) =>
      budget.accounts.some((account) => account.hibiscusAccountId === hibiscusAccountId),
    );

    if (!budgetMapping) {
      throw new Error(`No budget mapping found for Hibiscus account ${hibiscusAccountId}`);
    }

    const accountMapping = budgetMapping.accounts.find((account) => account.hibiscusAccountId === hibiscusAccountId)!;

    logger.info(`Processing budget with sync ID: ${budgetMapping.syncId}`);
    await api.downloadBudget(budgetMapping.syncId);

    logger.info("Getting account list");
    const accounts = await api.getAccounts();
    const account = accounts.find((account) => account.id === accountMapping.accountId);

    if (!account) {
      throw new Error(`Account ${accountMapping.accountId} not found in Actual Budget`);
    }

    logger.info(`Fetching transactions for account: ${account.name}`);
    const hibiscusTransactions = await fetchHibiscusTransactions(config, hibiscusAccountId);
    logger.info(`Found ${hibiscusTransactions.length} transactions`);

    if (hibiscusTransactions.length === 0) {
      logger.info("No transactions to import");
      return;
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
  } finally {
    logger.info("Shutting down");
    await api.shutdown();
  }
}
