/** Calendar helpers using Africa/Addis_Ababa so lead-time checks match Ethiopia local days. */

export const BUSINESS_TIMEZONE = 'Africa/Addis_Ababa';

/** Returns YYYY-MM-DD for a Date in the business timezone. */
export function calendarDateInTimeZone(
  date: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Add whole calendar days to a YYYY-MM-DD string (UTC noon anchor avoids DST edge cases). */
export function addCalendarDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  utc.setUTCDate(utc.getUTCDate() + days);
  const yyyy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d
  );
}
