import { TransactionEntity } from "@actual-app/api/@types/loot-core/types/models";

export type CreateActualTransaction = Pick<
  TransactionEntity,
  | "date"
  | "amount"
  | "imported_payee"
  | "category"
  | "notes"
  | "imported_id"
  | "transfer_id"
  | "cleared"
  | "subtransactions"
> & { payee_name: string };
