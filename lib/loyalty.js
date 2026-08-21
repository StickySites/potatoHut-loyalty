/** Max paid stamps stored in DB (slots 1–7). Slot 8 is the permanent yellow FREE marker in the UI. */
export const MAX_EARNED_STAMPS = 7;

/** Default demo customer when no ?customerId= is provided. */
export const DEMO_CUSTOMER_ID = "SQ-USER-987654321";

/**
 * Minimum payment amount (minor units / cents / pence) to earn one stamp.
 * Default £5.00 = 500 pence. Override with LOYALTY_STAMP_THRESHOLD_CENTS.
 */
export function getStampThresholdCents() {
  const raw = process.env.LOYALTY_STAMP_THRESHOLD_CENTS;
  const parsed = raw == null || raw === "" ? 500 : Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 500;
}

export function clampStamps(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), MAX_EARNED_STAMPS);
}

export function resolveCustomerId(raw) {
  if (typeof raw !== "string") return DEMO_CUSTOMER_ID;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : DEMO_CUSTOMER_ID;
}
