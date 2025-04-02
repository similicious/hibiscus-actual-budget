import { CreateActualTransaction } from "@app/model/create-actual-transaction";
import { HibiscusTransaction } from "@app/model/hibiscus-transaction";
import { format } from "date-fns";

export function mapToActualTransaction(hibiscusTx: HibiscusTransaction): CreateActualTransaction {
  return {
    date: format(hibiscusTx.datum, "yyyy-MM-dd"), // Format as YYYY-MM-DD
    amount: hibiscusTx.betrag, // Already converted to cents by schema
    payee_name: hibiscusTx.empfaenger_name,
    imported_payee: hibiscusTx.empfaenger_name,
    notes: formatNotes(hibiscusTx),
    imported_id: hibiscusTx.checksum,
    cleared: true,
  };
}

function formatNotes(tx: HibiscusTransaction): string {
  const details = [
    ...(tx.art == undefined ? [] : `Type: ${tx.art}`),
    `Note: ${[tx.zweck, tx.zweck2, tx.zweck3].filter(Boolean).join(" ")}`,
    `Id: ${tx.id}`,
  ];

  return details.join(" | ");
}
