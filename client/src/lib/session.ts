export const LAST_ORDER_STORAGE_KEY = 'banagifts-last-order';
export const MY_ORDERS_PHONE_KEY = 'banagifts-my-orders-phone';

export interface LastOrderInfo {
  order_reference: string;
  tracking_token: string;
  total: number;
  currency: string;
  delivery_date: string;
}

export function saveLastOrder(info: LastOrderInfo): void {
  try {
    sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(info));
  } catch {
    // ignore storage failures
  }
}

export function readLastOrder(): LastOrderInfo | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastOrderInfo;
  } catch {
    return null;
  }
}

export function clearLastOrder(): void {
  try {
    sessionStorage.removeItem(LAST_ORDER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveMyOrdersPhone(phone: string): void {
  try {
    localStorage.setItem(MY_ORDERS_PHONE_KEY, phone.trim());
  } catch {
    // ignore
  }
}

export function readMyOrdersPhone(): string {
  try {
    return localStorage.getItem(MY_ORDERS_PHONE_KEY) ?? '';
  } catch {
    return '';
  }
}
