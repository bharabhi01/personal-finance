export type Row = { date: string; amount_paise: number; category: string; description: string; bank: string | null };
export type Range = { from: string | null; to: string | null };
export type Subscription = { name: string; amount_paise: number; bank: string | null; last: string; next: string };

const DAY = 86400000;
const MAX_DAYS = 366;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(s + 'T00:00:00Z');

/** Period keys: 'all', 'last-3'…'last-12' (calendar months up to today) or 'YYYY-MM'. */
export function periodRange(period: string, today: string): Range {
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month) {
    const [y, m] = [Number(month[1]), Number(month[2])];
    return { from: period + '-01', to: iso(new Date(Date.UTC(y, m, 0))) };
  }
  const months = Number(period.replace('last-', ''));
  if (!(months > 0)) return { from: null, to: null };
  const [y, m] = today.split('-').map(Number);
  return { from: iso(new Date(Date.UTC(y, m - months, 1))), to: null };
}

export function monthOptions(today: string, count = 12) {
  const [y, m] = today.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const label = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
    return { value: iso(d).slice(0, 7), label };
  });
}

export function filterRows<T extends Row>(rows: T[], range: Range, category: string): T[] {
  return rows.filter(
    (r) =>
      (!range.from || r.date >= range.from) &&
      (!range.to || r.date <= range.to) &&
      (category === 'All' || r.category === category),
  );
}

export function categoryTotals(rows: Row[]) {
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(r.category, (totals.get(r.category) ?? 0) + r.amount_paise);
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals]
    .map(([name, value]) => ({ name, value, share: sum ? value / sum : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function summarize(rows: Row[]) {
  const total = rows.reduce((a, r) => a + r.amount_paise, 0);
  return {
    total,
    count: rows.length,
    average: rows.length ? Math.round(total / rows.length) : 0,
    top: categoryTotals(rows)[0] ?? null,
  };
}

/** One point per day across the range (most recent 366 days at most), zero-filled. */
export function dailySeries(rows: Row[], range: Range, today: string) {
  const start = range.from ?? rows.reduce((min, r) => (r.date < min ? r.date : min), today);
  const end = range.to ?? today;
  if (start > end) return { points: [], clipped: false };
  const byDay = new Map<string, number>();
  for (const r of rows) byDay.set(r.date, (byDay.get(r.date) ?? 0) + r.amount_paise);
  const last = parse(end).getTime();
  let day = parse(start).getTime();
  const clipped = (last - day) / DAY + 1 > MAX_DAYS;
  if (clipped) day = last - (MAX_DAYS - 1) * DAY;
  const points: { date: string; value: number }[] = [];
  for (; day <= last; day += DAY) {
    const date = iso(new Date(day));
    points.push({ date, value: byDay.get(date) ?? 0 });
  }
  return { points, clipped };
}

export function addMonth(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(y, m, Math.min(d, lastDay))));
}

/** Each distinct 'Subscriptions' expense by its latest charge, next due a month later, soonest first. */
export function subscriptions(rows: Row[]): Subscription[] {
  const latest = new Map<string, Row>();
  for (const r of rows) {
    if (r.category !== 'Subscriptions') continue;
    const key = r.description.trim().toLowerCase();
    const current = latest.get(key);
    if (!current || r.date > current.date) latest.set(key, r);
  }
  return [...latest.values()]
    .map((r) => ({ name: r.description, amount_paise: r.amount_paise, bank: r.bank, last: r.date, next: addMonth(r.date) }))
    .sort((a, b) => a.next.localeCompare(b.next));
}
