/** The fields expense summaries read. */
export type Row = { date: string; amount_paise: number; category: string | null; description: string; bank: string | null };
/** A full ledger row, needed for money flow and balances. */
export type LedgerRow = Row & { kind: string; to_bank: string | null; created_at: string };
export type Account = { name: string; balance: number | null; savings: boolean; asOf: string | null };
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
  for (const r of rows) {
    const name = r.category ?? 'Other';
    totals.set(name, (totals.get(name) ?? 0) + r.amount_paise);
  }
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

/** Where income went in a period. Shares are fractions of income (null when no income was logged). */
export function moneyFlow(rows: LedgerRow[]) {
  const sum = (kind: string) => rows.filter((r) => r.kind === kind).reduce((a, r) => a + r.amount_paise, 0);
  const income = sum('income'), expenses = sum('expense'), investments = sum('investment'), savings = sum('savings');
  const share = (value: number) => (income > 0 ? value / income : null);
  return {
    income, expenses, investments, savings,
    left: income - expenses - investments - savings,
    shares: { expenses: share(expenses), investments: share(investments), savings: share(savings) },
  };
}

const bankKey = (name: string) => name.trim().toLowerCase();

/**
 * Current balance per bank: the latest balance the owner reported plus everything logged after it
 * (dated on/after the report and entered later): income adds; expenses and investments subtract;
 * a savings transfer subtracts from its bank and adds to its to_bank. Banks that have received a
 * savings transfer are savings accounts. A bank with no reported balance has balance null.
 */
export function accountBalances(rows: LedgerRow[]) {
  const newestFirst = [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const accounts = new Map<string, Account & { report?: LedgerRow }>();
  const account = (name: string) => {
    const key = bankKey(name);
    if (!accounts.has(key)) accounts.set(key, { name: name.trim(), balance: null, savings: false, asOf: null });
    return accounts.get(key)!;
  };
  for (const r of newestFirst) {
    if (r.bank) account(r.bank);
    if (r.to_bank) account(r.to_bank).savings = true;
  }
  for (const r of newestFirst) {
    const a = r.kind === 'balance' && r.bank ? account(r.bank) : null;
    if (a && !a.report) Object.assign(a, { report: r, balance: r.amount_paise, asOf: r.date });
  }
  for (const r of rows) {
    if (r.kind === 'balance') continue;
    const move = (name: string | null, amount: number) => {
      const a = name ? accounts.get(bankKey(name)) : undefined;
      if (!a?.report || r.date < a.report.date || Date.parse(r.created_at) <= Date.parse(a.report.created_at)) return;
      a.balance = a.balance! + amount;
    };
    const sign = r.kind === 'income' ? 1 : -1;
    move(r.bank, sign * r.amount_paise);
    if (r.kind === 'savings') move(r.to_bank, r.amount_paise);
  }
  const list = [...accounts.values()]
    .map(({ name, balance, savings, asOf }) => ({ name, balance, savings, asOf }))
    .sort((a, b) => Number(b.savings) - Number(a.savings) || a.name.localeCompare(b.name));
  const known = list.filter((a) => a.balance !== null);
  return {
    accounts: list,
    total: known.reduce((sum, a) => sum + a.balance!, 0),
    savingsTotal: known.filter((a) => a.savings).reduce((sum, a) => sum + a.balance!, 0),
    savingsUnknown: list.filter((a) => a.savings && a.balance === null).length,
  };
}
