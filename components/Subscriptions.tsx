import { useState } from 'react';
import { formatDate, money } from '@/lib/format';
import { frequencies } from '@/lib/validation.mjs';
import type { Frequency, Subscription } from '@/lib/summary';

const PER: Record<Frequency, string> = { weekly: 'week', monthly: 'month', quarterly: 'quarter', yearly: 'year' };

export default function Subscriptions({ items, onFrequency }: { items: Subscription[]; onFrequency: (name: string, frequency: Frequency) => Promise<void> }) {
  const [error, setError] = useState('');
  const monthly = items.reduce((sum, s) => sum + s.monthly_paise, 0);
  const change = (name: string, frequency: Frequency) => {
    setError('');
    onFrequency(name, frequency).catch((e) => setError(e instanceof Error ? e.message : 'Could not save the frequency.'));
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
          <li key={s.name}>
            <div>
              <strong>{s.name}</strong>
              <span className="meta">{s.bank ?? 'No account'} · next ~{formatDate(s.next)}</span>
            </div>
            <select className="frequency" value={s.frequency} onChange={(e) => change(s.name, e.target.value as Frequency)} aria-label={`How often ${s.name} is billed`}>
              {frequencies.map((f: string) => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
            </select>
            <span className="amount">{money(s.amount_paise)}<span className="muted"> / {PER[s.frequency]}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
