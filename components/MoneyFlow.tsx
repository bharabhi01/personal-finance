import { money } from '@/lib/format';
import type { moneyFlow } from '@/lib/summary';
import { Rings } from '@/components/Art';

type Flow = ReturnType<typeof moneyFlow>;

const percent = (share: number | null) => (share === null ? '—' : Math.round(share * 100) + '%');

export default function MoneyFlow({ flow }: { flow: Flow }) {
  const parts = [
    { label: 'Expenses', value: flow.expenses, share: flow.shares.expenses, color: '#f2c14e' },
    { label: 'Investments', value: flow.investments, share: flow.shares.investments, color: '#bcd4e6' },
    { label: 'Savings', value: flow.savings, share: flow.shares.savings, color: '#c8f23a' },
  ];
  const outflow = flow.expenses + flow.investments + flow.savings;
  const scale = Math.max(flow.income, outflow, 1);

  return (
    <section className="tile tile-green">
      <span className="label">Where your income went</span>
      <strong className="big">{money(flow.income)}</strong>
      <span className="sub">income this period</span>
      <Rings className="art-corner" />
      {flow.income === 0 && <p className="hint">No income logged in this period, so percentages can't be shown. Tell Instinct, e.g. "Salary 150000 Kotak Bank".</p>}
      {outflow + flow.income === 0 ? (
        <p className="empty">Nothing logged in this period.</p>
      ) : (
        <>
          <div className="flow-bar" role="img" aria-label="Share of income by expenses, investments and savings">
            {parts.map((p) => <span key={p.label} style={{ width: (p.value / scale) * 100 + '%', background: p.color }} />)}
          </div>
          <ul className="legend flow-legend">
            {parts.map((p) => (
              <li key={p.label}>
                <span className="dot" style={{ background: p.color }} />
                <span className="legend-name">{p.label}</span>
                <span className="legend-value">{money(p.value)}</span>
                <span className="legend-share">{percent(p.share)}</span>
              </li>
            ))}
            {flow.income > 0 && (
              <li>
                <span className="dot" style={{ background: 'rgba(255,255,255,.35)' }} />
                <span className="legend-name">{flow.left < 0 ? 'Over income by' : 'Unallocated'}</span>
                <span className="legend-value">{money(Math.abs(flow.left))}</span>
                <span className="legend-share">{percent(Math.abs(flow.left) / flow.income)}</span>
              </li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}
