/** Digits only. */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Ethiopia-friendly match key: last 9 national digits when possible
 * (e.g. 0911223344, +251911223344, 911223344 → 911223344).
 */
export function phoneMatchKey(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.length >= 9) return digits.slice(-9);
  return digits;
}

export function phonesMatch(a: string, b: string): boolean {
  const ka = phoneMatchKey(a);
  const kb = phoneMatchKey(b);
  if (!ka || !kb) return false;
  return ka === kb;
}
