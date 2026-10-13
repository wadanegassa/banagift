/** Formats money for Ethiopia (ETB) by default, with am-ET / en-ET friendly output. */
export function formatMoney(amount: number, currency = 'ETB', locale = 'en-ET'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const code = (currency || 'ETB').toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'symbol',
      minimumFractionDigits: code === 'ETB' ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return code === 'ETB' ? `Br ${safeAmount.toFixed(0)}` : `${code} ${safeAmount.toFixed(2)}`;
  }
}

/** Formats an ISO date string for Ethiopia-friendly display. */
export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Soft Ethiopian phone display helper — keeps digits and leading +. */
export function formatPhoneDisplay(phone: string): string {
  return phone.trim();
}
