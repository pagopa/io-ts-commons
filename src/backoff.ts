/**
 * Provides an implementation of backoff algorithms to be used when waiting
 * between retries of a failing task.
 */

import { Millisecond } from "./units";

// for an explanation of these constants, see:
// https://cloud.google.com/storage/docs/exponential-backoff
export const DEFAULT_EXPONENTIAL_BACKOFF_BASE_INTERVAL = 500 as Millisecond;
export const DEFAULT_EXPONENTIAL_BACKOFF_MULTIPLIER = 2;
export const DEFAULT_EXPONENTIAL_BACKOFF_MAX_JITTER = 1000 as Millisecond;
export const DEFAULT_EXPONENTIAL_BACKOFF_MAX = (32 * 1000) as Millisecond;

/**
 * Returns a function that calculates the backoff interval for each try after
 * a failure.
 *
 * For an explanation of the algorithm, see:
 * https://cloud.google.com/storage/docs/exponential-backoff
 *
 * @param n Is the try count, starts from 0
 */
export function calculateExponentialBackoffInterval(
  baseInterval: Millisecond = DEFAULT_EXPONENTIAL_BACKOFF_BASE_INTERVAL,
  multiplier: number = DEFAULT_EXPONENTIAL_BACKOFF_MULTIPLIER,
  maxJitter: Millisecond = DEFAULT_EXPONENTIAL_BACKOFF_MAX_JITTER,
  maxBackoff: Millisecond = DEFAULT_EXPONENTIAL_BACKOFF_MAX
): (n: number) => Millisecond {
  return count => {
    // The jitter helps to avoid cases where many clients get synchronized by
    // some situation and all retry at once, sending requests in synchronized
    // waves.
    const jitter = Math.random() * maxJitter;
    // The wait time is:
    // min((b*(m^n)+random_number_milliseconds), maximum_backoff)
    // with n incremented by 1 for each iteration (request).
    const delayInterval = baseInterval * Math.pow(multiplier, count) + jitter;
    return Math.min(delayInterval, maxBackoff) as Millisecond;
  };
}
