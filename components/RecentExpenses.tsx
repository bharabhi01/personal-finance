'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { categoryColor, formatDate, money } from '@/lib/format';
import type { Transaction } from '@/lib/store';

/** Most rows rendered while collapsed; more never fit on screen. */
const MAX_COLLAPSED = 50;

export default function RecentExpenses({
  rows,
  onEdit,
  onDelete,
  onExport,
}: {
  rows: Transaction[];
  onEdit: (e: Transaction) => void;
  onDelete: (e: Transaction) => void;
  onExport: () => void;
}) {
  const [all, setAll] = useState(false);
  const [fit, setFit] = useState(MAX_COLLAPSED);
  const list = useRef<HTMLUListElement>(null);
  const shown = all ? rows : rows.slice(0, MAX_COLLAPSED);

  // Collapsed, the list fills the card's height (set by the cards beside it); rows past the bottom are hidden.
  useLayoutEffect(() => {
    const el = list.current;
    if (!el || all) return;
    const measure = () => {
      const items = [...el.children] as HTMLElement[];
      const first = items.findIndex((li) => li.offsetTop + li.offsetHeight > el.clientHeight);
      setFit(first === -1 ? items.length : first);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [all, shown.length]);
  const hiddenCount = all ? 0 : rows.length - Math.min(fit, shown.length);

  return (
    <section className="card recent">
      <header className="card-head">
        <h2>Recent expenses</h2>
        <button className="link" onClick={onExport} disabled={!rows.length}>Export CSV</button>
      </header>
      {rows.length === 0 && <p className="empty">No expenses in this view.</p>}
      <ul className={all ? 'expenses' : 'expenses fit'} ref={list}>
        {shown.map((e, i) => (
          <li key={e.id} style={!all && i >= fit ? { visibility: 'hidden' } : undefined}>
            <span className="dot big" style={{ background: categoryColor(e.category ?? 'Other') }} aria-hidden="true" />
            <div className="expense-main">
              <strong>{e.description}</strong>
              <span className="meta">
                {e.category} · {e.bank ?? 'No account'} · {formatDate(e.date)}
                {e.source === 'whatsapp' && <span className="tag">via Instinct</span>}
              </span>
            </div>
            <span className="amount">{money(e.amount_paise)}</span>
            <div className="row-actions">
              <button className="link" onClick={() => onEdit(e)} aria-label={`Edit ${e.description}`}>Edit</button>
              <button className="link danger" onClick={() => onDelete(e)} aria-label={`Delete ${e.description}`}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {(all || hiddenCount > 0) && (
        <button className="link more" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</button>
      )}
    </section>
  );
}
