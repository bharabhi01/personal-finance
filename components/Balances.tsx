import { formatDate, money } from '@/lib/format';
import type { accountBalances } from '@/lib/summary';

type Balances = ReturnType<typeof accountBalances>;

export default function Balances({ data }: { data: Balances }) {
  const hasSavings = data.accounts.some((a) => a.savings);
  return (
    <section className="balances">
      <div className="orb" aria-hidden="true" />
      <span className="label">Total balance</span>
      <strong className="hero-number">{money(data.total)}</strong>
      {data.accounts.length === 0 && <p className="empty">Tell Instinct your balance, e.g. "Kotak Bank balance 85000".</p>}
      {data.accounts.length > 0 && (
        <>
          {hasSavings && (
            <div className="pin">
              <span className="pin-dot" aria-hidden="true" />
              <span className="label">Savings</span>
              <strong className="pin-value">{money(data.savingsTotal)}</strong>
              {data.savingsUnknown > 0 && <span className="muted">+ {data.savingsUnknown} savings account without a balance</span>}
            </div>
          )}
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
