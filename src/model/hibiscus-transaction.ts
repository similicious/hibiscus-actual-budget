import { z } from "zod";

// Schema for Hibiscus transaction validation
export const hibiscusTransactionSchema = z.object({
  datum: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .transform((date) => new Date(date)),
  betrag: z.string().transform((val) => {
    const amount = parseFloat(val);
    if (isNaN(amount)) {
      throw new Error("Invalid amount format");
    }
    // Convert to cents and round to avoid floating point issues
    return Math.round(amount * 100);
  }),
  empfaenger_name: z.string().min(1, "Payee name is required"),
  art: z.string(),
  zweck: z.string().optional(),
  zweck2: z.string().optional(),
  zweck3: z.string().optional(),
  id: z.string(),
  checksum: z.string(),
});

export type HibiscusTransaction = z.infer<typeof hibiscusTransactionSchema>;
