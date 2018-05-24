import {
  calculateExponentialBackoffInterval,
  DEFAULT_EXPONENTIAL_BACKOFF_BASE_INTERVAL,
  DEFAULT_EXPONENTIAL_BACKOFF_MAX,
  DEFAULT_EXPONENTIAL_BACKOFF_MAX_JITTER,
  DEFAULT_EXPONENTIAL_BACKOFF_MULTIPLIER
} from "../backoff";
import { Millisecond } from "../units";

describe("exponentialBackoff", () => {
  it("should produce an exponentially increasing delay time", () => {
    const backoff = calculateExponentialBackoffInterval(
      DEFAULT_EXPONENTIAL_BACKOFF_BASE_INTERVAL,
      DEFAULT_EXPONENTIAL_BACKOFF_MULTIPLIER,
      0 as Millisecond,
      DEFAULT_EXPONENTIAL_BACKOFF_MAX
    );
    const tries = Array.from(Array(8).keys());
    const delays = tries.map(backoff);

    expect(delays).toMatchSnapshot();
  });

  it("should produce an exponentially increasing delay time with jitter", () => {
    const backoffNoJitter = calculateExponentialBackoffInterval(
      DEFAULT_EXPONENTIAL_BACKOFF_BASE_INTERVAL,
      DEFAULT_EXPONENTIAL_BACKOFF_MULTIPLIER,
      0 as Millisecond,
      DEFAULT_EXPONENTIAL_BACKOFF_MAX
    );
    const jitter = 1000 as Millisecond;
    const backoffWithJitter = calculateExponentialBackoffInterval(
      DEFAULT_EXPONENTIAL_BACKOFF_BASE_INTERVAL,
      DEFAULT_EXPONENTIAL_BACKOFF_MULTIPLIER,
      jitter,
      DEFAULT_EXPONENTIAL_BACKOFF_MAX
    );
    const tries = Array.from(Array(8).keys());
    const delaysNoJitter = tries.map(backoffNoJitter);
    const delaysWithJitter = tries.map(backoffWithJitter);

    // tslint:disable-next-line:no-let
    for (let i = 0; i < tries.length; i++) {
      const diff = delaysWithJitter[i] - delaysNoJitter[i];
      expect(diff).toBeGreaterThanOrEqual(0);
      expect(diff).toBeLessThanOrEqual(jitter);
    }
  });
});
