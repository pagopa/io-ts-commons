import { FiscalCode } from "./strings";

import * as crypto from "node:crypto";

export const hashFiscalCode = (fiscalCode: FiscalCode) => {
  const hash = crypto.createHash("sha256");
  hash.update(fiscalCode);
  return hash.digest("hex");
};
