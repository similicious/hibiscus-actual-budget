import { z } from "zod";

const parseAmount = (val: string) => {
  const amount = parseFloat(val);
  if (isNaN(amount)) {
    throw new Error("Invalid amount format");
  }
  // Convert to cents and round to avoid floating point issues
  return Math.round(amount * 100);
};

// Schema for Hibiscus transaction validation
export const hibiscusTransactionSchema = z.object({
  // Date fields
  datum: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .transform((date) => new Date(date)),
  valuta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Value date must be in YYYY-MM-DD format")
    .transform((date) => new Date(date)),

  // Amount fields
  betrag: z.string().transform(parseAmount),
  saldo: z.string().transform(parseAmount),

  // Account and bank details
  empfaenger_name: z.string().min(1, "Payee name is required"),
  empfaenger_konto: z.string(),
  empfaenger_blz: z.string(),
  konto_id: z.string().regex(/^\d+$/, "Account ID must be numeric"),

  // Transaction details
  art: z.string().min(1, "Transaction type is required"),
  zweck: z.string().optional(),
  zweck2: z.string().optional(),
  zweck3: z.string().optional(),
  id: z.string().transform((id) => parseInt(id, 10)),
  checksum: z.string(),
});

export type HibiscusTransaction = z.infer<typeof hibiscusTransactionSchema>;
