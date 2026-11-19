import { useState } from 'react';
import { formatDate, money } from '@/lib/format';
import { frequencies, statuses } from '@/lib/validation.mjs';
import type { Frequency, Schedule, Status, Subscription } from '@/lib/summary';

const FREQUENCY: Record<Frequency, [label: string, per: string]> = {
  weekly: ['Weekly', 'week'], monthly: ['Monthly', 'month'], quarterly: ['Quarterly', 'quarter'], 'half-yearly': ['Every 6 months', '6 months'], yearly: ['Yearly', 'year'],
};
const STATUS: Record<Status, string> = { active: 'Active', paused: 'Paused', cancelled: 'Cancelled' };

export default function Subscriptions({ items, onChange }: { items: Subscription[]; onChange: (name: string, change: Partial<Schedule>) => Promise<void> }) {
  const [error, setError] = useState('');
  const monthly = items.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.monthly_paise, 0);
  const change = (name: string, value: Partial<Schedule>) => {
    setError('');
    onChange(name, value).catch((e) => setError(e instanceof Error ? e.message : 'Could not save the schedule.'));
  };
  return (
    <section className="card">
      <header className="card-head">
        <h2>My subscriptions</h2>
        {items.length > 0 && <span className="muted">≈ {money(monthly)} / month</span>}
      </header>
      {items.length === 0 && <p className="empty">Expenses in the Subscriptions category appear here.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <ul className="subs">
        {items.map((s) => (
          <li key={s.name} className={s.status === 'active' ? undefined : 'inactive'}>
            <div>
              <strong>{s.name}</strong>
              <span className="meta">
                {s.bank ?? 'No account'} · {s.status === 'active' ? `next ~${formatDate(s.next)}` : `${STATUS[s.status]} · last ${formatDate(s.last)}`}
              </span>
            </div>
            <select className="pill" value={s.frequency} onChange={(e) => change(s.name, { frequency: e.target.value as Frequency })} aria-label={`How often ${s.name} is billed`}>
              {(frequencies as Frequency[]).map((f) => <option key={f} value={f}>{FREQUENCY[f][0]}</option>)}
            </select>
            <select className="pill" value={s.status} onChange={(e) => change(s.name, { status: e.target.value as Status })} aria-label={`Status of ${s.name}`}>
              {(statuses as Status[]).map((v) => <option key={v} value={v}>{STATUS[v]}</option>)}
            </select>
            <span className="amount">{money(s.amount_paise)}<span className="muted"> / {FREQUENCY[s.frequency][1]}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
