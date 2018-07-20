/**
 * Typescript (io-ts) types related to PagoPA.
 */
import * as t from "io-ts";
import {
  // tslint:disable-next-line:no-unused-variable
  IPatternStringTag,
  OrganizationFiscalCode,
  PatternString
} from "./strings";

export const MAX_AMOUNT_DIGITS = 10;
export const CENTS_IN_ONE_EURO = 100;
export const AmountInEuroCents = PatternString(`[0-9]{${MAX_AMOUNT_DIGITS}}`);
export type AmountInEuroCents = t.TypeOf<typeof AmountInEuroCents>;

/**
 * Convert a number into its "AmountInEuroCents" counterpart:
 * 1) convert to # of cents
 * 2) pad with 0's
 * encode() functionality is also available (converting
 * AmountInEuroCents into a number)
 */
export const AmountInEuroCentsFromNumber = new t.Type<
  AmountInEuroCents,
  number,
  number
>(
  "AmountInEuroCentsFromNumber",
  AmountInEuroCents.is,
  (i, c) =>
    AmountInEuroCents.validate(
      `${"0".repeat(MAX_AMOUNT_DIGITS)}${Math.floor(
        i * CENTS_IN_ONE_EURO
      )}`.slice(-MAX_AMOUNT_DIGITS),
      c
    ),
  a => parseInt(a, 10) / CENTS_IN_ONE_EURO
);

const PAYMENT_NOTICE_NUMBER_LENGTH = 18;

const QR_CODE_LENGTH = 52;

const ORGANIZATION_FISCAL_CODE_LENGTH = 11;

const RPT_ID_LENGTH =
  PAYMENT_NOTICE_NUMBER_LENGTH + ORGANIZATION_FISCAL_CODE_LENGTH;

export type AuxDigit = "0" | "1" | "2" | "3";

export const ApplicationCode = PatternString("[0-9]{2}");
export type ApplicationCode = t.TypeOf<typeof ApplicationCode>;

export const SegregationCode = PatternString("[0-9]{2}");
export type SegregationCode = t.TypeOf<typeof SegregationCode>;

export const IUV13 = PatternString("[0-9]{13}");
export type IUV13 = t.TypeOf<typeof IUV13>;

export const IUV15 = PatternString("[0-9]{15}");
export type IUV15 = t.TypeOf<typeof IUV15>;

export const IUV17 = PatternString("[0-9]{17}");
export type IUV17 = t.TypeOf<typeof IUV17>;

export const IUV = t.union([IUV13, IUV15, IUV17]);
export type IUV = t.TypeOf<typeof IUV>;

export const CheckDigit = PatternString("[0-9]{2}");
export type CheckDigit = t.TypeOf<typeof CheckDigit>;

// PaymentNoticeNumber (NumeroAvviso) may assume one between this 4 shapes:
//
//  | Aux | Application Code | Codice segregazione | IUV | Check digit |
//  |:---:|:----------------:|:-------------------:|:---:|:-----------:|
//  |  0  |         x        |                     |  13 |      x      |
//  |  1  |                  |                     |  17 |             |
//  |  2  |                  |                     |  15 |      x      |
//  |  3  |                  |          x          |  13 |      x      |

// See https://pagopa-specifichepagamenti.readthedocs.io/it/latest/_docs/Capitolo7.html#il-numero-avviso-e-larchivio-dei-pagamenti-in-attesa

export const PaymentNoticeNumber0 = t.interface({
  applicationCode: ApplicationCode,
  auxDigit: t.literal("0"),
  checkDigit: CheckDigit,
  iuv13: IUV13
});
export type PaymentNoticeNumber0 = t.TypeOf<typeof PaymentNoticeNumber0>;

export const PaymentNoticeNumber1 = t.interface({
  auxDigit: t.literal("1"),
  iuv17: IUV17
});
export type PaymentNoticeNumber1 = t.TypeOf<typeof PaymentNoticeNumber1>;

export const PaymentNoticeNumber2 = t.interface({
  auxDigit: t.literal("2"),
  checkDigit: CheckDigit,
  iuv15: IUV15
});
export type PaymentNoticeNumber2 = t.TypeOf<typeof PaymentNoticeNumber2>;

export const PaymentNoticeNumber3 = t.interface({
  auxDigit: t.literal("3"),
  checkDigit: CheckDigit,
  iuv13: IUV13,
  segregationCode: SegregationCode
});
export type PaymentNoticeNumber3 = t.TypeOf<typeof PaymentNoticeNumber3>;

// <aux digit (1n)>[<application code> (2n)]<codice IUV (15|17n)>
export const PaymentNoticeNumber = t.taggedUnion("auxDigit", [
  PaymentNoticeNumber0,
  PaymentNoticeNumber1,
  PaymentNoticeNumber2,
  PaymentNoticeNumber3
]);

export type PaymentNoticeNumber = t.TypeOf<typeof PaymentNoticeNumber>;

/**
 * Private convenience method,
 * use PaymentNoticeNumberFromString.encode() instead.
 */
function paymentNoticeNumberToString(
  paymentNoticeNumber: PaymentNoticeNumber
): string {
  return [
    paymentNoticeNumber.auxDigit,
    paymentNoticeNumber.auxDigit === "0"
      ? paymentNoticeNumber.applicationCode
      : "",
    paymentNoticeNumber.auxDigit === "3"
      ? paymentNoticeNumber.segregationCode
      : "",
    paymentNoticeNumber.auxDigit === "0"
      ? paymentNoticeNumber.iuv13
      : paymentNoticeNumber.auxDigit === "1"
        ? paymentNoticeNumber.iuv17
        : paymentNoticeNumber.auxDigit === "2"
          ? paymentNoticeNumber.iuv15
          : paymentNoticeNumber.auxDigit === "3"
            ? paymentNoticeNumber.iuv13
            : "",
    paymentNoticeNumber.auxDigit !== "1" ? paymentNoticeNumber.checkDigit : ""
  ].join("");
}

/**
 * Decodes a string into a valid PaymentNoticeNumber (NumeroAvviso).
 *
 *    const paymentNotice = PaymentNoticeNumberFromString.decode(
 *      "244012345678901200")
 *
 * will decode a PaymentNoticeNumber (NumeroAvviso) into its parts
 * according to the AuxDigit field value.
 *
 * To convert a PaymentNoticeNumber into a string:
 *
 *    PaymentNoticeNumber.decode({
 *      auxDigit: "2",
 *      checkDigit: "44",
 *      iuv15: "012345678901200"
 *    }).map(PaymentNoticeNumberFromString.encode)
 *
 */
export const PaymentNoticeNumberFromString = new t.Type<
  PaymentNoticeNumber,
  string
>(
  "PaymentNoticeNumberFromString",
  PaymentNoticeNumber.is,
  (v, c) =>
    PaymentNoticeNumber.is(v)
      ? t.success(v)
      : t.string.validate(v, c).chain(s => {
          if (s.length !== PAYMENT_NOTICE_NUMBER_LENGTH) {
            return t.failure(s, c);
          }
          switch (s[0]) {
            case "0": {
              // tslint:disable-next-line:no-dead-store
              const [, auxDigit, applicationCode, iuv13, checkDigit, ..._] =
                s.match(/^(\d{1})(\d{2})(\d{13})(\d{2})$/) || [];
              return PaymentNoticeNumber0.decode({
                applicationCode,
                auxDigit,
                checkDigit,
                iuv13
              } as PaymentNoticeNumber0);
            }
            case "1": {
              // tslint:disable-next-line:no-dead-store
              const [, auxDigit, iuv17, ..._] =
                s.match(/^(\d{1})(\d{17})$/) || [];
              return PaymentNoticeNumber1.decode({
                auxDigit,
                iuv17
              } as PaymentNoticeNumber1);
            }
            case "2": {
              // tslint:disable-next-line:no-dead-store
              const [, auxDigit, iuv15, checkDigit, ..._] =
                s.match(/^(\d{1})(\d{15})(\d{2})$/) || [];
              return PaymentNoticeNumber2.decode({
                auxDigit,
                checkDigit,
                iuv15
              } as PaymentNoticeNumber2);
            }
            case "3": {
              // tslint:disable-next-line:no-dead-store
              const [, auxDigit, segregationCode, iuv13, checkDigit, ..._] =
                s.match(/^(\d{1})(\d{2})(\d{13})(\d{2})$/) || [];
              return PaymentNoticeNumber3.decode({
                auxDigit,
                checkDigit,
                iuv13,
                segregationCode
              } as PaymentNoticeNumber3);
            }
            default:
              return t.failure(s, c);
          }
        }),
  paymentNoticeNumberToString
);

export type PaymentNoticeNumberFromString = t.TypeOf<
  typeof PaymentNoticeNumberFromString
>;

//
//  PagoPA QR Code
//

const PaymentNoticeQrCode2 = t.interface({
  amount: AmountInEuroCents,
  identifier: t.literal("PAGOPA"),
  organizationFiscalCode: OrganizationFiscalCode,
  paymentNoticeNumber: PaymentNoticeNumberFromString,
  version: t.literal("002")
});
type PaymentNoticeQrCode2 = t.TypeOf<typeof PaymentNoticeQrCode2>;

/**
 * Defines the QR Code string that contains PagoPA payment information.
 */
export const PaymentNoticeQrCode = t.taggedUnion("version", [
  PaymentNoticeQrCode2
]);
export type PaymentNoticeQrCode = t.TypeOf<typeof PaymentNoticeQrCode>;

/**
 * Private convenience method,
 * use PaymentNoticeQrCodeFromString.encode() instead.
 */
function paymentNoticeQrCodeToString(qrCode: PaymentNoticeQrCode): string {
  return [
    qrCode.identifier,
    qrCode.version,
    PaymentNoticeNumberFromString.encode(qrCode.paymentNoticeNumber),
    qrCode.organizationFiscalCode,
    qrCode.amount
  ].join("|");
}

/**
 * Decodes a string into a valid PaymentNoticeQrCode.
 *
 *  const qrCode = PaymentNoticeQrCodeFromString.decode(
 *    "PAGOPA|002|123456789012345678|12345678901|1234567801");
 *
 * will parse a PaymentNoticeQrCodeString into its parts:
 *
 *    qrCode = {
 *      identifier: "PAGOPA",
 *      version: "002",
 *      paymentNoticeNumber: {
 *        auxDigit: "1",
 *        checkDigit: "23",
 *        iuv15: "456789012345678"
 *      },
 *      organizationFiscalCode: "12345678901",
 *      amount: "1234567801"
 *    }
 *
 * To convert a PaymentNoticeQrCode into a string:
 *
 *    PaymentNoticeQrCode.decode({
 *      identifier: "PAGOPA",
 *      version: "002",
 *      paymentNoticeNumber: {
 *        auxDigit: "2",
 *        checkDigit: "22",
 *        iuv15: "012345678901234"
 *      },
 *      organizationFiscalCode: "01234567891",
 *      amount: "1234567890"
 *    }).map(PaymentNoticeQrCodeFromString.encode)
 *
 */
export const PaymentNoticeQrCodeFromString = new t.Type<
  PaymentNoticeQrCode,
  string
>(
  "PaymentNoticeQrCodeFromString",
  PaymentNoticeQrCode.is,
  (v, c) =>
    PaymentNoticeQrCode.is(v)
      ? t.success(v)
      : t.string.validate(v, c).chain(s => {
          if (s.length !== QR_CODE_LENGTH) {
            return t.failure(s, c);
          }
          const [
            identifier,
            version,
            paymentNoticeNumber,
            organizationFiscalCode,
            amount,
            // tslint:disable-next-line:no-dead-store
            ..._
          ] =
            s.split("|") || [];
          return PaymentNoticeQrCode.decode({
            amount,
            identifier,
            organizationFiscalCode,
            paymentNoticeNumber,
            version
          });
        }),
  paymentNoticeQrCodeToString
);

export type PaymentNoticeQrCodeFromString = t.TypeOf<
  typeof PaymentNoticeQrCodeFromString
>;

//
//  PagoPA RPT id, used during RPT activation
//

/**
 * Private convenience method,
 * use RptIdFromString.encode() instead.
 */
function rptIdToString(rptId: RptId): string {
  return [
    rptId.organizationFiscalCode,
    PaymentNoticeNumberFromString.encode(rptId.paymentNoticeNumber)
  ].join("");
}

/**
 * The id used for the PagoPA RPT requests
 */
export const RptId = t.interface({
  organizationFiscalCode: OrganizationFiscalCode,
  paymentNoticeNumber: PaymentNoticeNumberFromString
});
export type RptId = t.TypeOf<typeof RptId>;

export const RptIdFromString = new t.Type<RptId, string>(
  "RptIdFromString",
  RptId.is,
  (v, c) =>
    RptId.is(v)
      ? t.success(v)
      : t.string.validate(v, c).chain(s => {
          if (s.length !== RPT_ID_LENGTH) {
            return t.failure(s, c);
          }
          const [
            ,
            organizationFiscalCode,
            paymentNoticeNumber,
            // tslint:disable-next-line:no-dead-store
            ..._
          ] =
            s.match(/^(\d{11})(\d{18})$/) || [];
          return RptId.decode({
            organizationFiscalCode,
            paymentNoticeNumber
          });
        }),
  rptIdToString
);

export type RptIdFromString = t.TypeOf<typeof RptIdFromString>;

export function rptIdFromPaymentNoticeQrCode(
  paymentNoticeQrCode: PaymentNoticeQrCode
): t.Validation<RptId> {
  return RptId.decode({
    organizationFiscalCode: paymentNoticeQrCode.organizationFiscalCode,
    paymentNoticeNumber: paymentNoticeQrCode.paymentNoticeNumber
  });
}

/**
 * Convert a QR code string into an RptId
 * (the inverse function cannot exist because
 * "amount" only exists in the QR code)
 * @param qrCodeString string in the format PAGOPA|002|...
 */
export function rptIdFromQrCodeString(
  qrCodeString: string
): t.Validation<RptId> {
  return PaymentNoticeQrCodeFromString.decode(qrCodeString).chain(
    rptIdFromPaymentNoticeQrCode
  );
}
