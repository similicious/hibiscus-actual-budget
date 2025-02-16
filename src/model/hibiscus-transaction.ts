export interface HibiscusTransaction {
  datum: string;
  betrag: string;
  empfaenger_name: string;
  art: string;
  zweck: string;
  zweck2?: string;
  zweck3?: string;
  id: string;
  checksum: string;
}
