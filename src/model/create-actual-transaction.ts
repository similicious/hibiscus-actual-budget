import { ImportTransactionEntity } from "@actual-app/api/@types/loot-core/src/types/models";

export type CreateActualTransaction = Pick<
  ImportTransactionEntity,
  | "account"
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
