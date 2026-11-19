'use client';
import { categories, frequencies } from '@/lib/validation.mjs';
import { todayIST } from '@/lib/format';
import type { Entry, Transaction } from '@/lib/store';
import { FREQUENCY_LABEL } from '@/lib/format';
import type { Frequency } from '@/lib/summary';

export default function ExpenseForm({
  expense,
  repeats,
  banks,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  expense?: Transaction;
  /** The expense's current frequency, or '' when it doesn't repeat. */
  repeats: Frequency | '';
  banks: string[];
  busy: boolean;
  error: string;
  onSubmit: (entry: Entry, repeats: Frequency | '') => void;
  onCancel: () => void;
}) {
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    onSubmit({
      kind: 'expense',
      to_bank: null,
      amount_paise: Math.round(Number(f.get('amount')) * 100),
      description: String(f.get('description')),
      category: String(f.get('category')),
      bank: String(f.get('bank')).trim() || null,
      date: String(f.get('date')),
    }, String(f.get('repeats')) as Frequency | '');
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Amount (₹)
        <input name="amount" inputMode="decimal" placeholder="2300" required autoFocus pattern="[0-9]+(\.[0-9]{1,2})?" title="Up to two decimal places"
          defaultValue={expense ? (expense.amount_paise / 100).toString() : undefined} />
      </label>
      <label>
        Description
        <input name="description" maxLength={200} placeholder="Claude Subscription" required defaultValue={expense?.description} />
      </label>
      <label>
        Category
        <select name="category" defaultValue={expense?.category ?? 'Food'}>
          {categories.map((c: string) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label>
        Bank / account
        <input name="bank" list="banks" maxLength={100} placeholder="Kotak Bank" defaultValue={expense?.bank ?? ''} />
        <datalist id="banks">{banks.map((b) => <option key={b} value={b} />)}</datalist>
      </label>
      <label>
        Repeats
        <select name="repeats" defaultValue={repeats}>
          {!repeats && <option value="">Doesn't repeat</option>}
          {(frequencies as Frequency[]).map((v) => <option key={v} value={v}>{FREQUENCY_LABEL[v]}</option>)}
        </select>
      </label>
      <label>
        Date
        <input name="date" type="date" required defaultValue={expense?.date ?? todayIST()} />
      </label>
      <p className="error" role="alert">{error}</p>
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}</button>
      </div>
    </form>
  );
}
