import { CreateActualTransaction } from "@app/model/create-actual-transaction";
import { HibiscusTransaction } from "@app/model/hibiscus-transaction";
import { logger } from "@app/utils/logger";

export function mapToActualTransaction(hibiscusTx: HibiscusTransaction): CreateActualTransaction {
  try {
    return {
      date: hibiscusTx.datum.toISOString().split("T")[0], // Format as YYYY-MM-DD
      amount: hibiscusTx.betrag, // Already converted to cents by schema
      payee_name: hibiscusTx.empfaenger_name,
      imported_payee: hibiscusTx.empfaenger_name,
      notes: formatNotes(hibiscusTx),
      imported_id: hibiscusTx.checksum,
      cleared: true,
    };
  } catch (error) {
    logger.error("Transaction conversion failed", error as Error, { transaction: hibiscusTx });
    throw error;
  }
}

function formatNotes(tx: HibiscusTransaction): string {
  const details = [
    `Type: ${tx.art}`,
    `Note: ${[tx.zweck, tx.zweck2, tx.zweck3].filter(Boolean).join(" ")}`,
    `Id: ${tx.id}`,
  ];

  return details.join(" | ");
}
