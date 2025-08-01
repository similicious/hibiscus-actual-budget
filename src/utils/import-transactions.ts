import api from "@actual-app/api";
import { Config, TransactionFilter } from "@app/model/config";
import { HibiscusTransaction } from "@app/model/hibiscus-transaction";
import { fetchHibiscusTransactions } from "@app/utils/hibiscus";
import { logger } from "@app/utils/logger";
import { mapToActualTransaction } from "@app/utils/transactions";
import { sendNotification } from "./notifications";

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

    logger.info(
      `Fetching transactions of the last ${accountMapping.fetchDaysAmount} days for account: ${account.name}`,
    );
    let hibiscusTransactions = await fetchHibiscusTransactions(
      config,
      hibiscusAccountId,
      accountMapping.fetchDaysAmount,
    );
    logger.info(`Found ${hibiscusTransactions.length} transactions`);

    if (hibiscusTransactions.length === 0) {
      logger.info("No transactions to import");
      return;
    }

    let filteredTransactionCount = 0;

    if (accountMapping.transactionFilters) {
      logger.info("Filtering transactions, found %s filter rules", accountMapping.transactionFilters.length);
      const txCountBeforeFiltering = hibiscusTransactions.length;

      hibiscusTransactions = hibiscusTransactions.filter(
        (tx) =>
          !accountMapping.transactionFilters!.some((transactionFilter) =>
            isTransactionFilterMatching(tx, transactionFilter),
          ),
      );
      const txCountAfterFiltering = hibiscusTransactions.length;
      filteredTransactionCount = txCountBeforeFiltering - txCountAfterFiltering;

      logger.info("Filtering transactions done, dropped %s transactions", filteredTransactionCount);
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
      `Import Summary for ${account.name}: \n- Added: ${result.added.length} transactions\n- Updated: ${result.updated.length} transactions\n- Filtered: ${filteredTransactionCount} transactions`,
    );

    if (result.errors && result.errors.length > 0) {
      logger.error(`- Errors: ${result.errors.length}`);
      result.errors.forEach((error) => logger.error(`${error}`));
    }

    // Send notification with sync summary
    await sendNotification(config, {
      title: `Hibiscus Sync Complete: ${account.name}`,
      message: `Added: ${result.added.length}
Updated: ${result.updated.length}
Filtered: ${filteredTransactionCount}${result.errors?.length ? `\nErrors: ${result.errors.length}` : ""}
Balance Status: ${actualBalance === hibiscusBalance ? "✅ Balances Match" : "❌ Balances Differ"}`,
      link: {
        label: "View Account",
        url: `${config.actual.serverUrl}/accounts/${accountMapping.accountId}`,
      },
    });
  } finally {
    logger.info("Shutting down");
    await api.shutdown();
  }
}

function isTransactionFilterMatching(tx: HibiscusTransaction, filter: TransactionFilter) {
  return filter.every(({ property, value }) => tx[property]?.toString().toLowerCase().includes(value.toLowerCase()));
}
