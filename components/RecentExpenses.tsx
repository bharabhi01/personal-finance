'use client';
import { useState } from 'react';
import { categoryColor, formatDate, money } from '@/lib/format';
import type { Transaction } from '@/lib/store';

const RECENT = 8;

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
  const shown = all ? rows : rows.slice(0, RECENT);

  return (
    <section className="card">
      <header className="card-head">
        <h2>Recent expenses</h2>
        <button className="link" onClick={onExport} disabled={!rows.length}>Export CSV</button>
      </header>
      {rows.length === 0 && <p className="empty">No expenses in this view.</p>}
      <ul className="expenses">
        {shown.map((e) => (
          <li key={e.id}>
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
      {rows.length > RECENT && (
        <button className="link more" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</button>
      )}
    </section>
  );
}
