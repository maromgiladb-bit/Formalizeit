/**
 * Phone-number input helpers.
 *
 * The fill form accepts international numbers, so we don't enforce a single
 * country format — we only keep the characters that legitimately appear in a
 * phone number and reject free text (letters were previously accepted).
 */

/** Characters allowed in a phone field: digits, spaces, and + - ( ) . */
const PHONE_ALLOWED = /[^\d+\-\s().]/g;

/** Strip any character that can't appear in a phone number (e.g. letters). */
export function filterPhoneChars(value: string): string {
  return value.replace(PHONE_ALLOWED, '');
}

/**
 * A phone value is considered valid when, ignoring formatting, it contains a
 * plausible number of digits (7–15, per E.164's 15-digit maximum). Empty is
 * treated as valid so the field can stay optional; callers gate on required-ness.
 */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
