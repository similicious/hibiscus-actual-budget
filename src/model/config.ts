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

const accountMappingSchema = z.object({
  accountId: z.string().min(1),
  hibiscusAccountId: z.number().min(1),
});

const budgetConfigSchema = z.object({
  syncId: z.string().min(1),
  accounts: z.array(accountMappingSchema).min(1),
});

export const configSchema = z.object({
  actual: actualConfigSchema,
  hibiscus: hibiscusConfigSchema,
  dataDir: z.string(),
  budgets: z.array(budgetConfigSchema).min(1),
});

export type Config = z.infer<typeof configSchema>;
