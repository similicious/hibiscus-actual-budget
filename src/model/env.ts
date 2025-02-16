import { z } from "zod";

// Schema for environment variables
export const envSchema = z.object({
  HIBISCUS_URL: z.string().url(),
  HIBISCUS_USERNAME: z.string().min(1),
  HIBISCUS_PASSWORD: z.string().min(1),
  ACTUAL_SERVER_URL: z.string().url(),
  ACTUAL_SYNC_ID: z.string().min(1),
  ACTUAL_PASSWORD: z.string().min(1),
});

type AppEnvironment = z.infer<typeof envSchema>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends AppEnvironment {}
  }
}
