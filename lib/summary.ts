/** The fields expense summaries read. */
export type Row = { date: string; amount_paise: number; category: string | null; description: string; bank: string | null };
/** A full ledger row, needed for money flow and balances. */
export type LedgerRow = Row & { kind: string; to_bank: string | null; created_at: string };
export type Range = { from: string | null; to: string | null };
export type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
export type Status = 'active' | 'paused' | 'cancelled';
export type Schedule = { frequency: Frequency; status: Status };
export type Subscription = { name: string; category: string; amount_paise: number; bank: string | null; last: string; next: string; frequency: Frequency; status: Status; monthly_paise: number };

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

/** The month ('YYYY-MM') of the most recent entry, or today's month when there are none. */
export function latestMonth(rows: Row[], today: string) {
  return rows.reduce((latest, r) => (r.date > latest ? r.date : latest), '').slice(0, 7) || today.slice(0, 7);
}

/** The `count` months ending at the month of `newest` (a date), newest first. */
export function monthOptions(newest: string, count = 12) {
  const [y, m] = newest.split('-').map(Number);
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

/** The same day `months` later, clamped to the end of a shorter month. */
export function addMonth(date: string, months = 1) {
  const [y, m, d] = date.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m + months, 0)).getUTCDate();
  return iso(new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))));
}

const MONTHS: Record<Frequency, number> = { weekly: 12 / 52, monthly: 1, quarterly: 3, 'half-yearly': 6, yearly: 12 };
const STATUS_ORDER: Record<Status, number> = { active: 0, paused: 1, cancelled: 2 };

/** When a subscription charged on `date` is next due. */
export function nextCharge(date: string, frequency: Frequency) {
  return frequency === 'weekly' ? iso(new Date(parse(date).getTime() + 7 * DAY)) : addMonth(date, MONTHS[frequency]);
}

/** A subscription's name as stored with its schedule: trimmed and lower-cased. */
export const subscriptionKey = (name: string) => name.trim().toLowerCase();

/**
 * Each distinct recurring expense by its latest charge: every Subscriptions expense, plus expenses of any
 * other category that have a schedule. The schedule (keyed by subscriptionKey) defaults to monthly and active;
 * monthly_paise is the cost per month. Active ones come first, soonest due first, then paused, then cancelled.
 */
export function subscriptions(rows: Row[], schedules: Record<string, Partial<Schedule>> = {}): Subscription[] {
  const latest = new Map<string, Row>();
  for (const r of rows) {
    const key = subscriptionKey(r.description);
    if (r.category !== 'Subscriptions' && !schedules[key]) continue;
    const current = latest.get(key);
    if (!current || r.date > current.date) latest.set(key, r);
  }
  return [...latest]
    .map(([key, r]) => {
      const frequency = schedules[key]?.frequency ?? 'monthly', status = schedules[key]?.status ?? 'active';
      return {
        name: r.description, category: r.category!, amount_paise: r.amount_paise, bank: r.bank, last: r.date,
        next: nextCharge(r.date, frequency), frequency, status, monthly_paise: Math.round(r.amount_paise / MONTHS[frequency]),
      };
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.next.localeCompare(b.next));
}

/**
 * Where income went in a period. A transfer between your own banks is not spending: savings is what is left of
 * the transfers into savings banks after spending from them, so money spent from savings counts once, as an
 * expense. Shares are fractions of income (null when no income was logged).
 */
export function moneyFlow(rows: LedgerRow[]) {
  const sum = (kind: string) => rows.filter((r) => r.kind === kind).reduce((a, r) => a + r.amount_paise, 0);
  const income = sum('income'), expenses = sum('expense'), investments = sum('investment');
  const savings = savingsPot(rows);
  const share = (value: number) => (income > 0 ? value / income : null);
  return {
    income, expenses, investments, savings,
    left: income - expenses - investments - savings,
    shares: { expenses: share(expenses), investments: share(investments), savings: share(savings) },
  };
}

const bankKey = (name: string) => name.trim().toLowerCase();

/**
 * Current balance per bank that has a reported balance: the latest balance the owner reported plus
 * everything logged after it (dated on/after the report and entered later): income adds; expenses and
 * investments subtract; a savings transfer subtracts from its bank and adds to its to_bank.
 */
export function accountBalances(rows: LedgerRow[]) {
  const newestFirst = [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const accounts = new Map<string, { name: string; balance: number; report: LedgerRow }>();
  for (const r of newestFirst) {
    if (r.kind !== 'balance' || !r.bank || accounts.has(bankKey(r.bank))) continue;
    accounts.set(bankKey(r.bank), { name: r.bank.trim(), balance: r.amount_paise, report: r });
  }
  for (const r of rows) {
    if (r.kind === 'balance') continue;
    const move = (name: string | null, amount: number) => {
      const a = name ? accounts.get(bankKey(name)) : undefined;
      if (!a || r.date < a.report.date || Date.parse(r.created_at) <= Date.parse(a.report.created_at)) return;
      a.balance += amount;
    };
    move(r.bank, (r.kind === 'income' ? 1 : -1) * r.amount_paise);
    if (r.kind === 'savings') move(r.to_bank, r.amount_paise);
  }
  const list = [...accounts.values()].map(({ name, balance }) => ({ name, balance })).sort((a, b) => a.name.localeCompare(b.name));
  return { accounts: list, total: list.reduce((sum, a) => sum + a.balance, 0) };
}

/**
 * What is left of the money transferred into savings accounts: each account's transfers in, less the
 * expenses, investments and transfers out of that bank dated on/after its first transfer (never below zero).
 */
function savingsPot(rows: LedgerRow[]) {
  const pots = new Map<string, { moved: number; since: string }>();
  for (const r of rows) {
    if (r.kind !== 'savings' || !r.to_bank) continue;
    const key = bankKey(r.to_bank), pot = pots.get(key);
    pots.set(key, { moved: (pot?.moved ?? 0) + r.amount_paise, since: pot && pot.since < r.date ? pot.since : r.date });
  }
  let left = 0;
  for (const [key, pot] of pots) {
    const spent = rows
      .filter((r) => r.bank && bankKey(r.bank) === key && ['expense', 'investment', 'savings'].includes(r.kind) && r.date >= pot.since)
      .reduce((sum, r) => sum + r.amount_paise, 0);
    left += Math.max(0, pot.moved - spent);
  }
  return left;
}

/** What was spent on credit cards (banks named "… Credit Card") across the given rows. */
export function creditCardSpend(rows: LedgerRow[]) {
  return rows.filter((r) => r.kind === 'expense' && /credit card/i.test(r.bank ?? '')).reduce((sum, r) => sum + r.amount_paise, 0);
}
