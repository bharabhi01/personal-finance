export const categories = ['Housing', 'Bills', 'Food', 'Groceries', 'Shopping', 'Subscriptions', 'Travel', 'Health', 'EMI', 'Insurance', 'Family', 'Other'];
export const frequencies = ['weekly', 'monthly', 'quarterly', 'half-yearly', 'yearly'];
export const statuses = ['active', 'paused', 'cancelled'];
export const kinds = ['expense', 'income', 'investment', 'savings', 'balance'];

const MAX_EXPENSE = 100000000;      // ₹10,00,000
const MAX_OTHER = 100000000000;     // ₹100 crore
const DEFAULT_DESCRIPTION = {savings: 'Savings transfer', balance: 'Balance'};

function bankName(value, label) {
 if (value === undefined || value === null || value === '') return null;
 if (typeof value !== 'string' || value.trim().length > 100) throw new Error(label + ' must be at most 100 characters.');
 return value.trim() || null;
}

/** Validates one ledger row of any kind (defaults to an expense). Amounts are integer paise. */
export function validateEntry(input) {
 if (!input || typeof input !== 'object') throw new Error('Invalid entry.');
 const kind = input.kind ?? 'expense';
 if (!kinds.includes(kind)) throw new Error('Kind must be one of: ' + kinds.join(', ') + '.');
 const {amount_paise, date} = input;
 const min = kind === 'balance' ? 0 : 1, max = kind === 'expense' ? MAX_EXPENSE : MAX_OTHER;
 if (!Number.isSafeInteger(amount_paise) || amount_paise < min || amount_paise > max) {
  throw new Error(kind === 'expense' ? 'Amount must be between ₹0.01 and ₹10,00,000.' : kind === 'balance' ? 'Balance must be zero or more.' : 'Amount must be more than zero.');
 }
 if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+'T00:00:00Z')) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date) throw new Error('Use a real date.');
 const description = input.description ? input.description : DEFAULT_DESCRIPTION[kind];
 if (typeof description !== 'string' || !description.trim() || description.trim().length>200) throw new Error('Description must be 1 to 200 characters.');
 if (kind === 'expense' && !categories.includes(input.category)) throw new Error('Category must be one of: '+categories.join(', ')+'.');
 const bank = bankName(input.bank, 'Bank');
 const to_bank = kind === 'savings' ? bankName(input.to_bank, 'To bank') : null;
 if (kind === 'balance' && !bank) throw new Error('A balance needs a bank.');
 if (kind === 'savings') {
  if (!bank || !to_bank) throw new Error('Savings need a from_bank and a to_bank.');
  if (bank.toLowerCase() === to_bank.toLowerCase()) throw new Error('Savings must move between two different banks.');
 }
 return {kind, amount_paise, date, description: description.trim(), category: kind === 'expense' ? input.category : null, bank, to_bank};
}

const GROUPS = {expenses: 'expense', income: 'income', investments: 'investment', savings: 'savings', balances: 'balance'};

function rupeesToPaise(amount) {
 const rupees = typeof amount === 'string' && /^\d+(\.\d{1,2})?$/.test(amount) ? Number(amount) : amount;
 const paise = Math.round(rupees * 100);
 if (typeof rupees !== 'number' || Math.abs(paise / 100 - rupees) > 1e-9) throw new Error('Amount must be a number in rupees with at most two decimals.');
 return paise;
}

/**
 * Instinct sends one message as lists per kind (expenses, income, investments, savings, balances), amounts in
 * rupees, optional dates (default `today`) and a message ID used to ignore retries. Order of lines is the list order above.
 * Any expense may carry a `frequency`, returned separately as {name, frequency}.
 */
export function validateInstinctBatch(input, today) {
 if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Send a JSON object.');
 if (typeof input.message_id !== 'string' || input.message_id.length<1 || input.message_id.length>256) throw new Error('Supply the original message_id.');
 const unknown = Object.keys(input).find(key => key !== 'message_id' && !(key in GROUPS));
 if (unknown) throw new Error('Unknown field "' + unknown + '". Use: ' + Object.keys(GROUPS).join(', ') + '.');
 const entries = [], schedules = [];
 for (const [group, kind] of Object.entries(GROUPS)) {
  if (input[group] === undefined) continue;
  if (!Array.isArray(input[group])) throw new Error(group + ' must be a list.');
  input[group].forEach((item, i) => {
   try {
    if (!item || typeof item !== 'object') throw new Error('Invalid entry.');
    const entry = validateEntry({
     kind, amount_paise: rupeesToPaise(item.amount), date: item.date ?? today, description: item.description,
     category: item.category, bank: kind === 'savings' ? item.from_bank : item.bank, to_bank: item.to_bank,
    });
    if (item.frequency !== undefined) {
     if (kind !== 'expense') throw new Error('Only an expense can have a frequency.');
     schedules.push(validateSchedule({name: entry.description, frequency: item.frequency}));
    }
    entries.push(entry);
   } catch (e) {
    throw new Error(group + ' #' + (i + 1) + ': ' + e.message);
   }
  });
 }
 if (entries.length < 1 || entries.length > 50) throw new Error('Send 1 to 50 entries in total.');
 return {message_id: input.message_id, entries, schedules};
}

const CHANGEABLE = ['amount', 'description', 'category', 'bank', 'from_bank', 'to_bank', 'date'];

/**
 * Applies an Instinct edit (rupee amounts, only the fields to change) to a saved row and validates the result.
 * The kind never changes; a savings row's source bank is `from_bank`.
 */
export function validateInstinctChange(current, input) {
 if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Send a JSON object.');
 const unknown = Object.keys(input).find(key => !CHANGEABLE.includes(key));
 if (unknown) throw new Error('Unknown field "' + unknown + '". Use: ' + CHANGEABLE.join(', ') + '.');
 if (!Object.keys(input).length) throw new Error('Send at least one field to change.');
 const bank = current.kind === 'savings' ? input.from_bank : input.bank;
 return validateEntry({
  kind: current.kind, amount_paise: input.amount === undefined ? current.amount_paise : rupeesToPaise(input.amount),
  date: input.date ?? current.date, description: input.description ?? current.description, category: input.category ?? current.category,
  bank: bank ?? current.bank, to_bank: input.to_bank ?? current.to_bank,
 });
}

/** A saved row as Instinct reads it: amount in rupees plus the ID to edit or delete it. */
export function instinctView(row) {
 return {id: row.id, kind: row.kind, amount: row.amount_paise / 100, date: row.date, description: row.description, category: row.category, bank: row.bank, to_bank: row.to_bank, created_at: row.created_at};
}

/** A subscription's schedule change: its name (trimmed, lower-cased) and a frequency, a status or both. */
export function validateSchedule(input) {
 if (!input || typeof input !== 'object') throw new Error('Send a JSON object.');
 const name = typeof input.name === 'string' ? input.name.trim().toLowerCase() : '';
 if (!name || name.length > 200) throw new Error('Name must be 1 to 200 characters.');
 if (input.frequency === undefined && input.status === undefined) throw new Error('Send a frequency, a status or both.');
 if (input.frequency !== undefined && !frequencies.includes(input.frequency)) throw new Error('Frequency must be one of: ' + frequencies.join(', ') + '.');
 if (input.status !== undefined && !statuses.includes(input.status)) throw new Error('Status must be one of: ' + statuses.join(', ') + '.');
 return {name, ...(input.frequency !== undefined && {frequency: input.frequency}), ...(input.status !== undefined && {status: input.status})};
}

const COMPARED = ['kind', 'amount_paise', 'date', 'description', 'category', 'bank', 'to_bank'];

/** True when rows already saved for a message ID (ordered by line) match the incoming entries exactly. */
export function sameEntries(saved, entries) {
 return saved.length === entries.length && saved.every((row, i) => COMPARED.every(key => (row[key] ?? null) === (entries[i][key] ?? null)));
}
