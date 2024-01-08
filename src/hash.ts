import * as crypto from "crypto";

import { FiscalCode } from "./strings";

export const hashFiscalCode = (fiscalCode: FiscalCode): string => {
  const hash = crypto.createHash("sha256");
  hash.update(fiscalCode);
  return hash.digest("hex");
};
