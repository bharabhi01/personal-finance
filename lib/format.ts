export const money = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);

export const compactMoney = (paise: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(paise / 100);

export const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

/** "3 Oct", or "3 Oct 2025" when the year differs from today's. */
export function formatDate(iso: string) {
  const sameYear = iso.slice(0, 4) === todayIST().slice(0, 4);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso + 'T00:00:00Z'));
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Travel: '#0ea5e9',
  Shopping: '#ec4899',
  Bills: '#8b5cf6',
  Health: '#10b981',
  Subscriptions: '#4f46e5',
  Other: '#94a3b8',
};
export const categoryColor = (name: string) => CATEGORY_COLORS[name] ?? CATEGORY_COLORS.Other;
