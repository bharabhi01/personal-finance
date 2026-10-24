'use client';
import { useMemo, useState } from 'react';
import { categories } from '@/lib/validation.mjs';
import { money, todayIST } from '@/lib/format';
import { categoryTotals, dailySeries, filterRows, monthOptions, periodRange, subscriptions, summarize } from '@/lib/summary';
import type { Entry, Expense } from '@/lib/store';
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

export default function Dashboard({ initial, loadError, canSignOut }: { initial: Expense[]; loadError?: string; canSignOut: boolean }) {
  const today = todayIST();
  const [entries, setEntries] = useState(initial);
  const [period, setPeriod] = useState(today.slice(0, 7));
  const [category, setCategory] = useState('All');
  const [form, setForm] = useState<Expense | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const months = useMemo(() => monthOptions(today), [today]);
  const range = useMemo(() => periodRange(period, today), [period, today]);
  const rows = useMemo(
    () => filterRows(entries, range, category).sort((a, b) => b.date.localeCompare(a.date)),
    [entries, range, category],
  );
  const stats = summarize(rows);
  const totals = categoryTotals(rows);
  const daily = useMemo(() => dailySeries(rows, range, today), [rows, range, today]);
  const subs = useMemo(() => subscriptions(entries), [entries]);
  const banks = useMemo(() => [...new Set(entries.flatMap((e) => (e.bank ? [e.bank] : [])))].sort(), [entries]);

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
      const { expense } = await request(editing ? '/api/expenses/' + editing.id : '/api/expenses', editing ? 'PATCH' : 'POST', entry);
      setEntries(editing ? entries.map((e) => (e.id === editing.id ? expense : e)) : [expense, ...entries]);
      setForm(null);
    });

  const remove = (expense: Expense) =>
    run(async () => {
      await request('/api/expenses/' + expense.id, 'DELETE');
      setEntries(entries.filter((e) => e.id !== expense.id));
      setDeleting(null);
    });

  async function signOut() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.assign('/login');
  }

  function exportCsv() {
    const lines = [
      ['Date', 'Description', 'Category', 'Bank', 'Amount (INR)', 'Source'],
      ...rows.map((e) => [e.date, e.description, e.category, e.bank ?? '', (e.amount_paise / 100).toFixed(2), e.source]),
    ];
    const quote = (s: string) => '"' + (/^[=+\-@\t\r]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"';
    const blob = new Blob(['﻿' + lines.map((l) => l.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'expenses.csv' });
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const openForm = (value: Expense | 'new') => {
    setError('');
    setForm(value);
  };
  const closeForm = () => !busy && setForm(null);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand"><span className="logo" aria-hidden="true" />Expense tracker</div>
        <div className="topbar-actions">
          {canSignOut && <button className="btn ghost" onClick={signOut}>Sign out</button>}
          <button className="btn primary" onClick={() => openForm('new')}>+ Add expense</button>
        </div>
      </header>

      {loadError && <p className="banner" role="alert">{loadError}</p>}

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

      <div className="stats">
        <div className="card stat">
          <span className="stat-label">Total spent</span>
          <strong className="stat-value">{money(stats.total)}</strong>
          <span className="muted">{stats.count} {stats.count === 1 ? 'expense' : 'expenses'}</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Top category</span>
          <strong className="stat-value">{stats.top?.name ?? '—'}</strong>
          <span className="muted">{stats.top ? `${money(stats.top.value)} · ${Math.round(stats.top.share * 100)}% of spending` : 'No spending yet'}</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Average expense</span>
          <strong className="stat-value">{money(stats.average)}</strong>
          <span className="muted">per expense</span>
        </div>
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
        <Subscriptions items={subs} />
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
