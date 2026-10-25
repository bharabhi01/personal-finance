import { money } from '@/lib/format';
import type { moneyFlow, summarize, Subscription } from '@/lib/summary';
import { Arc, Waves } from '@/components/Art';
import MoneyFlow from '@/components/MoneyFlow';

export default function Mosaic({ flow, stats, subs }: { flow: ReturnType<typeof moneyFlow>; stats: ReturnType<typeof summarize>; subs: Subscription[] }) {
  const monthly = subs.reduce((sum, s) => sum + s.amount_paise, 0);
  return (
    <div className="mosaic">
      <MoneyFlow flow={flow} />
      <section className="tile tile-warm">
        <span className="label">Total spent</span>
        <strong className="big">{money(stats.total)}</strong>
        <span className="sub">{stats.count} {stats.count === 1 ? 'expense' : 'expenses'}</span>
        <Waves className="art-bottom" />
      </section>
      <section className="tile tile-dusk">
        <span className="label">Top category</span>
        <strong className="big">{stats.top?.name ?? '—'}</strong>
        <span className="sub">{stats.top ? `${money(stats.top.value)} · ${Math.round(stats.top.share * 100)}% of spending` : 'No spending yet'}</span>
        <Arc share={stats.top?.share ?? 0} className="art-bottom" />
      </section>
      <section className="tile tile-amber">
        <span className="label">Average expense</span>
        <strong className="big">{money(stats.average)}</strong>
        <span className="sub">per expense</span>
      </section>
      <section className="tile tile-moss">
        <span className="label">Subscriptions</span>
        <strong className="big">{money(monthly)}</strong>
        <span className="sub">per month · {subs.length} active</span>
      </section>
    </div>
  );
}
