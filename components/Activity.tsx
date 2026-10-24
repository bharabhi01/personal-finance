import { formatDate, money } from '@/lib/format';
import type { Transaction } from '@/lib/store';

const LABEL: Record<string, string> = { income: 'Income', investment: 'Investment', savings: 'Savings', balance: 'Balance' };
const RECENT = 8;

export default function Activity({ rows, onDelete }: { rows: Transaction[]; onDelete: (t: Transaction) => void }) {
  return (
    <section className="card">
      <header className="card-head"><h2>Income, investments &amp; savings</h2></header>
      {rows.length === 0 && <p className="empty">Nothing logged in this period.</p>}
      <ul className="expenses">
        {rows.slice(0, RECENT).map((t) => (
          <li key={t.id}>
            <div className="expense-main">
              <strong>{t.kind === 'balance' ? `${t.bank} balance` : t.description}</strong>
              <span className="meta">
                <span className={'tag kind-' + t.kind}>{LABEL[t.kind]}</span>
                {t.kind === 'savings' ? `${t.bank} → ${t.to_bank}` : t.kind === 'balance' ? 'Reported' : t.bank ?? 'No account'} · {formatDate(t.date)}
              </span>
            </div>
            <span className={'amount' + (t.kind === 'income' ? ' positive' : '')}>{(t.kind === 'income' ? '+' : '') + money(t.amount_paise)}</span>
            <button className="link danger" onClick={() => onDelete(t)} aria-label={`Delete ${t.description}`}>Delete</button>
          </li>
        ))}
      </ul>
      {rows.length > RECENT && <p className="muted more">Showing the latest {RECENT} of {rows.length}.</p>}
    </section>
  );
}
