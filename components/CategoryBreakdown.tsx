import { categoryColor, money } from '@/lib/format';

const R = 52, C = 2 * Math.PI * R;

export default function CategoryBreakdown({ totals, total }: { totals: { name: string; value: number; share: number }[]; total: number }) {
  let offset = 0;
  return (
    <div className="breakdown">
      <svg className="donut" viewBox="0 0 140 140" role="img" aria-label="Spending by category">
        <circle cx="70" cy="70" r={R} className="donut-track" />
        {totals.map((t) => {
          const length = t.share * C;
          const circle = (
            <circle key={t.name} cx="70" cy="70" r={R} fill="none" stroke={categoryColor(t.name)} strokeWidth="16"
              strokeDasharray={`${length} ${C - length}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
          );
          offset += length;
          return circle;
        })}
        <text x="70" y="66" textAnchor="middle" className="donut-label">Total</text>
        <text x="70" y="84" textAnchor="middle" className="donut-value">{money(total).replace(/\.00$/, '')}</text>
      </svg>
      <ul className="legend">
        {totals.map((t) => (
          <li key={t.name}>
            <span className="dot" style={{ background: categoryColor(t.name) }} />
            <span className="legend-name">{t.name}</span>
            <span className="legend-value">{money(t.value)}</span>
            <span className="legend-share">{Math.round(t.share * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
