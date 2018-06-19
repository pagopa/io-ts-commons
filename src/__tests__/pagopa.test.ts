import {
  ApplicationCode,
  AuxDigit,
  CheckDigit,
  CodiceSegregazione,
  IUV13,
  IUV15,
  IUV17,
  PaymentNoticeNumber,
  PaymentNoticeNumber0,
  PaymentNoticeNumber1,
  PaymentNoticeNumber2,
  PaymentNoticeNumber3,
  PaymentNoticeNumberFromString
} from "../pagopa";

import { isLeft, isRight } from "fp-ts/lib/Either";

describe("PaymentNoticeNumberFromString", () => {
  it("should succeed with valid PaymentNoticeNumberFromString", async () => {
    const someValidPaymentNoticeNumber: ReadonlyArray<string> = [
      "044012345678901200",
      "144012345678901200",
      "244012345678901200",
      "344012345678901200"
    ];
    someValidPaymentNoticeNumber.map(aValidPaymentNoticeNumber => {
      const validation = PaymentNoticeNumberFromString.decode(
        aValidPaymentNoticeNumber
      );
      expect(isRight(validation)).toBeTruthy();
      if (isRight(validation)) {
        const paymentNoticeNumber = validation.value;
        expect(paymentNoticeNumber.auxDigit).toBeDefined();
        switch (paymentNoticeNumber.auxDigit) {
          case "0":
            expect(paymentNoticeNumber.checkDigit).toBeDefined();
            expect(paymentNoticeNumber.applicationCode).toHaveLength(2);
            expect(paymentNoticeNumber.iuv13).toHaveLength(13);
            break;
          case "1":
            expect(paymentNoticeNumber.iuv17).toHaveLength(17);
            break;
          case "2":
            expect(paymentNoticeNumber.checkDigit).toHaveLength(2);
            expect(paymentNoticeNumber.iuv15).toHaveLength(15);
            break;
          case "3":
            expect(paymentNoticeNumber.checkDigit).toHaveLength(2);
            expect(paymentNoticeNumber.codiceSegregazione).toHaveLength(2);
            expect(paymentNoticeNumber.iuv13).toHaveLength(13);
            break;
        }
      }
      expect(PaymentNoticeNumber.is(validation.value)).toBeTruthy();
    });
  });

  it("should fail with invalid PaymentNoticeNumberFromString", async () => {
    const someInvalidPaymentNoticeNumber: ReadonlyArray<string> = [
      "444012345678901200", // invalid auxDigit
      "14401234567890120", // invalid length
      "24401234567890120X" // invalid char (digit)
    ];
    someInvalidPaymentNoticeNumber.map(aValidPaymentNoticeNumber => {
      const validation = PaymentNoticeNumberFromString.decode(
        aValidPaymentNoticeNumber
      );
      expect(isRight(validation)).toBeFalsy();
      expect(PaymentNoticeNumber.is(validation.value)).toBeFalsy();
    });
  });

  it("should encode a valid PaymentNoticeNumberFromString0", async () => {
    const aValidPaymentNoticeNumber: PaymentNoticeNumber0 = {
      applicationCode: "11" as ApplicationCode,
      auxDigit: "0",
      checkDigit: "22" as CheckDigit,
      iuv13: "0123456789012" as IUV13
    };
    const paymentNoticeString = PaymentNoticeNumberFromString.encode(
      aValidPaymentNoticeNumber
    );
    expect(paymentNoticeString).toEqual("011012345678901222");
  });

  it("should encode a valid PaymentNoticeNumberFromString1", async () => {
    const aValidPaymentNoticeNumber: PaymentNoticeNumber1 = {
      auxDigit: "1",
      iuv17: "01234567890123456" as IUV17
    };
    const paymentNoticeString = PaymentNoticeNumberFromString.encode(
      aValidPaymentNoticeNumber
    );
    expect(paymentNoticeString).toEqual("101234567890123456");
  });

  it("should encode a valid PaymentNoticeNumberFromString2", async () => {
    const aValidPaymentNoticeNumber: PaymentNoticeNumber2 = {
      auxDigit: "2",
      checkDigit: "22" as CheckDigit,
      iuv15: "012345678901234" as IUV15
    };
    const paymentNoticeString = PaymentNoticeNumberFromString.encode(
      aValidPaymentNoticeNumber
    );
    expect(paymentNoticeString).toEqual("201234567890123422");
  });

  it("should encode a valid PaymentNoticeNumberFromString3", async () => {
    const aValidPaymentNoticeNumber: PaymentNoticeNumber3 = {
      auxDigit: "3",
      checkDigit: "33" as CheckDigit,
      codiceSegregazione: "44" as CodiceSegregazione,
      iuv13: "0123456789012" as IUV13
    };
    const paymentNoticeString = PaymentNoticeNumberFromString.encode(
      aValidPaymentNoticeNumber
    );
    expect(paymentNoticeString).toEqual("344012345678901233");
  });
});
