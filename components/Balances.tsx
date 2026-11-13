import { money } from '@/lib/format';
import type { accountBalances } from '@/lib/summary';

type Balances = ReturnType<typeof accountBalances>;

export default function Balances({ data }: { data: Balances }) {
  return (
    <section className="balances">
      <div className="orb" aria-hidden="true" />
      <span className="label">Balances</span>
      {data.accounts.length === 0 ? (
        <p className="empty">Tell Instinct your balance, e.g. "Kotak Bank balance 85000".</p>
      ) : (
        <>
          <ul className="accounts">
            {data.accounts.map((a) => (
              <li key={a.name}>
                <strong>{a.name}</strong>
                <span className="amount">{money(a.balance)}</span>
              </li>
            ))}
          </ul>
          <span className="label total-label">Total balance</span>
          <strong className="hero-number">{money(data.total)}</strong>
        </>
      )}
    </section>
  );
}
