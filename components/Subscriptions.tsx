import { formatDate, money } from '@/lib/format';
import type { Subscription } from '@/lib/summary';

export default function Subscriptions({ items }: { items: Subscription[] }) {
  const monthly = items.reduce((sum, s) => sum + s.amount_paise, 0);
  return (
    <section className="card">
      <header className="card-head">
        <h2>My subscriptions</h2>
        {items.length > 0 && <span className="muted">≈ {money(monthly)} / month</span>}
      </header>
      {items.length === 0 && <p className="empty">Expenses in the Subscriptions category appear here.</p>}
      <ul className="subs">
        {items.map((s) => (
          <li key={s.name}>
            <div>
              <strong>{s.name}</strong>
              <span className="meta">{s.bank ?? 'No account'} · next ~{formatDate(s.next)}</span>
            </div>
            <span className="amount">{money(s.amount_paise)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
