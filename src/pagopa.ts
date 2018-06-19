/**
 * Typescript (io-ts) types related to PagoPA.
 */
import * as t from "io-ts";
// tslint:disable-next-line:no-unused-variable
import { IPatternStringTag, PatternString } from "./strings";

const PAYMENT_NOTICE_NUMBER_LENGTH = 18;

export type AuxDigit = "0" | "1" | "2" | "3";

export const ApplicationCode = PatternString("[0-9]{2}");
export type ApplicationCode = t.TypeOf<typeof ApplicationCode>;

export const CodiceSegregazione = PatternString("[0-9]{2}");
export type CodiceSegregazione = t.TypeOf<typeof CodiceSegregazione>;

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
  codiceSegregazione: CodiceSegregazione,
  iuv13: IUV13
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
 * Private convenience method, use PaymentNoticeNumber.encode() instead.
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
      ? paymentNoticeNumber.codiceSegregazione
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

const isPaymentNoticeNumber = (v: t.mixed): v is PaymentNoticeNumber =>
  PaymentNoticeNumber.is(v);

/**
 * Decodes a string into a valid PaymentNoticeNumber (NumeroAvviso).
 *
 * PaymentNoticeNumberFromString.decode("044012345678901200")
 * will decode a PaymentNoticeNumber (NumeroAvviso) into its parts
 * according to the AuxDigit field value.
 */
export const PaymentNoticeNumberFromString = new t.Type<
  PaymentNoticeNumber,
  string
>(
  "PaymentNoticeNumberFromString",
  isPaymentNoticeNumber,
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
              const [, auxDigit, codiceSegregazione, iuv13, checkDigit, ..._] =
                s.match(/^(\d{1})(\d{2})(\d{13})(\d{2})$/) || [];
              return PaymentNoticeNumber3.decode({
                auxDigit,
                checkDigit,
                codiceSegregazione,
                iuv13
              } as PaymentNoticeNumber3);
            }
            default:
              return t.failure(s, c);
          }
        }),
  a => paymentNoticeNumberToString(a)
);

export type PaymentNoticeNumberFromString = t.TypeOf<
  typeof PaymentNoticeNumberFromString
>;
