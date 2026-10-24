import { formatDate, money } from '@/lib/format';
import type { accountBalances } from '@/lib/summary';

type Balances = ReturnType<typeof accountBalances>;

export default function Balances({ data }: { data: Balances }) {
  const hasSavings = data.accounts.some((a) => a.savings);
  return (
    <section className="card">
      <header className="card-head"><h2>Bank balances</h2></header>
      {data.accounts.length === 0 && <p className="empty">Tell Instinct your balance, e.g. "Kotak Bank balance 85000".</p>}
      {data.accounts.length > 0 && (
        <>
          <div className="balance-totals">
            <div>
              <span className="stat-label">Total balance</span>
              <strong className="stat-value">{money(data.total)}</strong>
            </div>
            {hasSavings && (
              <div>
                <span className="stat-label">Savings</span>
                <strong className="stat-value savings">{money(data.savingsTotal)}</strong>
                {data.savingsUnknown > 0 && <span className="muted">+ {data.savingsUnknown} savings account without a balance</span>}
              </div>
            )}
          </div>
          <ul className="accounts">
            {data.accounts.map((a) => (
              <li key={a.name}>
                <div>
                  <span className="account-name">
                    <strong>{a.name}</strong>
                    {a.savings && <span className="tag savings-tag">Savings</span>}
                  </span>
                  {a.asOf && <span className="meta">Reported {formatDate(a.asOf)} + entries since</span>}
                </div>
                {a.balance === null ? <span className="muted">Balance not set</span> : <span className="amount">{money(a.balance)}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
