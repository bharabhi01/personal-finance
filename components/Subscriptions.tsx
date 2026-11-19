import { useState } from 'react';
import { FREQUENCY_LABEL, formatDate, money } from '@/lib/format';
import { frequencies, statuses } from '@/lib/validation.mjs';
import type { Frequency, Schedule, Status, Subscription } from '@/lib/summary';

const PER: Record<Frequency, string> = { weekly: 'week', monthly: 'month', quarterly: 'quarter', 'half-yearly': '6 months', yearly: 'year' };
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
        <h2>Recurring payments</h2>
        {items.length > 0 && <span className="muted">≈ {money(monthly)} / month</span>}
      </header>
      {items.length === 0 && <p className="empty">Subscriptions, and any expense set to repeat, appear here.</p>}
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
              {(frequencies as Frequency[]).map((f) => <option key={f} value={f}>{FREQUENCY_LABEL[f]}</option>)}
            </select>
            <select className="pill" value={s.status} onChange={(e) => change(s.name, { status: e.target.value as Status })} aria-label={`Status of ${s.name}`}>
              {(statuses as Status[]).map((v) => <option key={v} value={v}>{STATUS[v]}</option>)}
            </select>
            <span className="amount">{money(s.amount_paise)}<span className="muted"> / {PER[s.frequency]}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
