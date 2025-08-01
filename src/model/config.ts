import { hibiscusTransactionSchema } from "@app/model/hibiscus-transaction";
import { z } from "zod";

const actualConfigSchema = z.object({
  serverUrl: z.string().url(),
  password: z.string().min(1),
});

const hibiscusConfigSchema = z.object({
  url: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
});

const transactionFilterSchema = z.array(
  z.object({
    property: hibiscusTransactionSchema.keyof(),
    value: z.string(),
  }),
);

const accountMappingSchema = z.object({
  accountId: z.string().min(1),
  hibiscusAccountId: z.number().min(1),
  transactionFilters: z.array(transactionFilterSchema).optional(),
  fetchDaysAmount: z.number().default(12),
});

const budgetConfigSchema = z.object({
  syncId: z.string().min(1),
  accounts: z.array(accountMappingSchema).min(1),
});

const ntfyConfigSchema = z.object({
  topic: z.string().min(1),
});

const telegramConfigSchema = z.object({
  token: z.string().min(1),
  chatId: z.string().optional(),
});

const serverConfigSchema = z.object({
  publicUrl: z.string().url(),
});

export const configSchema = z
  .object({
    server: serverConfigSchema,
    actual: actualConfigSchema,
    hibiscus: hibiscusConfigSchema,
    notificationSchedule: z.string().min(1).describe("Cron syntax, e.g. '0 12 */2 * *' for noon every 2 days"),
    ntfy: ntfyConfigSchema.optional(),
    telegram: telegramConfigSchema.optional(),
    dataDir: z.string(),
    budgets: z.array(budgetConfigSchema).min(1),
  })
  .refine((data) => !!data.ntfy !== !!data.telegram, "Either ntfy or telegram config must be provided");

export type Config = z.infer<typeof configSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
