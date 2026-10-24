import { compactMoney, formatDate, money } from '@/lib/format';

const W = 720, H = 330, LEFT = 52, BOTTOM = 28, TOP = 12;

/** Round up to 1, 2 or 5 × a power of ten so gridlines land on tidy values. */
function niceMax(value: number) {
  const unit = 10 ** Math.floor(Math.log10(value));
  return ([1, 2, 5, 10].map((m) => m * unit).find((v) => v >= value) ?? value);
}

export default function DailyChart({ points }: { points: { date: string; value: number }[] }) {
  const max = niceMax(Math.max(...points.map((p) => p.value), 1));
  const plotW = W - LEFT, plotH = H - BOTTOM - TOP, slot = plotW / points.length;
  const y = (v: number) => TOP + plotH - (v / max) * plotH;
  const ticks = [0, 0.5, 1].map((t) => t * max);
  const labelAt = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily spending bar chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={LEFT} x2={W} y1={y(t)} y2={y(t)} className="grid" />
          <text x={LEFT - 8} y={y(t) + 4} textAnchor="end" className="axis">{t ? compactMoney(t) : '0'}</text>
        </g>
      ))}
      {points.map((p, i) => (
        <rect key={p.date} x={LEFT + i * slot + slot * 0.15} width={Math.max(slot * 0.7, 1)} y={y(p.value)}
          height={y(0) - y(p.value)} rx={Math.min(slot * 0.2, 3)} className="bar">
          <title>{`${formatDate(p.date)}: ${money(p.value)}`}</title>
        </rect>
      ))}
      {labelAt.map((i, n) => (
        <text key={i} x={LEFT + i * slot + slot / 2} y={H - 8} className="axis"
          textAnchor={n === 0 ? 'start' : n === 2 ? 'end' : 'middle'}>{formatDate(points[i].date)}</text>
      ))}
    </svg>
  );
}
