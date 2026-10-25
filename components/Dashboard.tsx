'use client';
import { useMemo, useState } from 'react';
import { categories } from '@/lib/validation.mjs';
import { money, todayIST } from '@/lib/format';
import { accountBalances, categoryTotals, dailySeries, filterRows, monthOptions, moneyFlow, periodRange, subscriptions, summarize } from '@/lib/summary';
import type { Entry, Transaction } from '@/lib/store';
import Activity from '@/components/Activity';
import Balances from '@/components/Balances';
import Mosaic from '@/components/Mosaic';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import DailyChart from '@/components/DailyChart';
import ExpenseForm from '@/components/ExpenseForm';
import Modal from '@/components/Modal';
import RecentExpenses from '@/components/RecentExpenses';
import Subscriptions from '@/components/Subscriptions';

const RANGES = [
  { value: 'last-3', label: 'Last 3 months' },
  { value: 'last-6', label: 'Last 6 months' },
  { value: 'last-9', label: 'Last 9 months' },
  { value: 'last-12', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];

async function request(url: string, method: string, body?: Entry) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error);
  return result;
}

export default function Dashboard({ initial, loadError, canSignOut }: { initial: Transaction[]; loadError?: string; canSignOut: boolean }) {
  const today = todayIST();
  const [entries, setEntries] = useState(initial);
  const [period, setPeriod] = useState(today.slice(0, 7));
  const [category, setCategory] = useState('All');
  const [form, setForm] = useState<Transaction | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const months = useMemo(() => monthOptions(today), [today]);
  const range = useMemo(() => periodRange(period, today), [period, today]);
  const expenses = useMemo(() => entries.filter((e) => e.kind === 'expense'), [entries]);
  const rows = useMemo(
    () => filterRows(expenses, range, category).sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, range, category],
  );
  const inPeriod = useMemo(() => filterRows(entries, range, 'All'), [entries, range]);
  const flow = useMemo(() => moneyFlow(inPeriod), [inPeriod]);
  const balances = useMemo(() => accountBalances(entries), [entries]);
  const activity = useMemo(
    () => inPeriod.filter((e) => e.kind !== 'expense').sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)),
    [inPeriod],
  );
  const stats = summarize(rows);
  const totals = categoryTotals(rows);
  const daily = useMemo(() => dailySeries(rows, range, today), [rows, range, today]);
  const subs = useMemo(() => subscriptions(expenses), [expenses]);
  const banks = useMemo(() => [...new Set(entries.flatMap((e) => [e.bank, e.to_bank].filter((b): b is string => !!b)))].sort(), [entries]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    setBusy(false);
  }

  const save = (entry: Entry) =>
    run(async () => {
      const editing = form !== 'new' && form;
      const { transaction } = await request(editing ? '/api/transactions/' + editing.id : '/api/transactions', editing ? 'PATCH' : 'POST', entry);
      setEntries(editing ? entries.map((e) => (e.id === editing.id ? transaction : e)) : [transaction, ...entries]);
      setForm(null);
    });

  const remove = (target: Transaction) =>
    run(async () => {
      await request('/api/transactions/' + target.id, 'DELETE');
      setEntries(entries.filter((e) => e.id !== target.id));
      setDeleting(null);
    });

  async function signOut() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.assign('/login');
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  }

  function exportCsv() {
    const lines = [
      ['Date', 'Description', 'Category', 'Bank', 'Amount (INR)', 'Source'],
      ...rows.map((e) => [e.date, e.description, e.category ?? '', e.bank ?? '', (e.amount_paise / 100).toFixed(2), e.source]),
    ];
    const quote = (s: string) => '"' + (/^[=+\-@\t\r]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"';
    const blob = new Blob(['﻿' + lines.map((l) => l.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'expenses.csv' });
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const openForm = (value: Transaction | 'new') => {
    setError('');
    setForm(value);
  };
  const closeForm = () => !busy && setForm(null);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand"><span className="logo" aria-hidden="true" />Expense tracker</div>
        <div className="topbar-actions">
          <button className="btn ghost icon" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
            <svg viewBox="0 0 24 24" className="icon-moon" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            <svg viewBox="0 0 24 24" className="icon-sun" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          </button>
          {canSignOut && (
            <button className="btn ghost icon" onClick={signOut} aria-label="Sign out" title="Sign out">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            </button>
          )}
          <button className="btn primary icon" onClick={() => openForm('new')} aria-label="Add expense" title="Add expense">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </header>

      {loadError && <p className="banner" role="alert">{loadError}</p>}

      <div className="hero-grid">
        <div className="hero">
          <h1>Your money,<br />at a glance</h1>
          <div className="filters">
            <label>
              Period
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <optgroup label="Month">
                  {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </optgroup>
                <optgroup label="Range">
                  {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </optgroup>
              </select>
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>All</option>
                {categories.map((c: string) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <Balances data={balances} />
        </div>
        <Mosaic flow={flow} stats={stats} subs={subs} />
      </div>

      <div className="grid two">
        <section className="card wide">
          <header className="card-head">
            <h2>Daily spending</h2>
            {daily.clipped && <span className="muted">Most recent 366 days</span>}
          </header>
          {stats.total ? <DailyChart points={daily.points} /> : <p className="empty">No spending in this view.</p>}
        </section>
        <section className="card">
          <header className="card-head"><h2>Category breakdown</h2></header>
          {stats.total ? <CategoryBreakdown totals={totals} total={stats.total} /> : <p className="empty">No spending in this view.</p>}
        </section>
      </div>

      <div className="grid two">
        <RecentExpenses rows={rows} onEdit={openForm} onDelete={(e) => { setError(''); setDeleting(e); }} onExport={exportCsv} />
        <div className="stack">
          <Subscriptions items={subs} />
          <Activity rows={activity} onDelete={(t) => { setError(''); setDeleting(t); }} />
        </div>
      </div>

      {form && (
        <Modal title={form === 'new' ? 'Add expense' : 'Edit expense'} onClose={closeForm}>
          <ExpenseForm key={form === 'new' ? 'new' : form.id} expense={form === 'new' ? undefined : form}
            banks={banks} busy={busy} error={error} onSubmit={save} onCancel={closeForm} />
        </Modal>
      )}
      {deleting && (
        <Modal title={`Delete ${deleting.description}?`} onClose={() => !busy && setDeleting(null)}>
          <p className="muted">{money(deleting.amount_paise)} · {deleting.date}. This can't be undone.</p>
          <p className="error" role="alert">{error}</p>
          <div className="actions">
            <button className="btn ghost" onClick={() => setDeleting(null)} disabled={busy}>Keep expense</button>
            <button className="btn danger" onClick={() => remove(deleting)} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
