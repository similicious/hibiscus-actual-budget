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

const ntfyConfigSchema = z.object({
  topic: z.string().min(1),
  schedule: z.string().min(1).describe("Cron syntax, e.g. '0 12 */2 * *' for noon every 2 days"),
});

const serverConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3000),
  publicUrl: z.string().url(),
});

export const configSchema = z.object({
  server: serverConfigSchema,
  actual: actualConfigSchema,
  hibiscus: hibiscusConfigSchema,
  ntfy: ntfyConfigSchema,
  dataDir: z.string(),
  budgets: z.array(budgetConfigSchema).min(1),
});

export type Config = z.infer<typeof configSchema>;
