export const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Subscriptions', 'Other'];

export function validateEntry(input) {
 if (!input || typeof input !== 'object') throw new Error('Invalid expense.');
 const {amount_paise, date, description, category} = input;
 if (!Number.isSafeInteger(amount_paise) || amount_paise <= 0 || amount_paise > 100000000) throw new Error('Amount must be between ₹0.01 and ₹10,00,000.');
 if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+'T00:00:00Z')) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date) throw new Error('Use a real expense date.');
 if (typeof description !== 'string' || !description.trim() || description.trim().length>200) throw new Error('Description must be 1 to 200 characters.');
 if (!categories.includes(category)) throw new Error('Category must be one of: '+categories.join(', ')+'.');
 const bank = input.bank ?? null;
 if (bank !== null && (typeof bank !== 'string' || bank.trim().length>100)) throw new Error('Bank must be at most 100 characters.');
 return {amount_paise,date,description:description.trim(),category,bank:bank?.trim() || null};
}

/** Instinct sends rupees (e.g. 2300 or "2300.50"), optional date (defaults to `today`) and a message ID used to ignore retries. */
export function validateInstinctBatch(input, today) {
 if (!input || !Array.isArray(input.expenses) || input.expenses.length<1 || input.expenses.length>50) throw new Error('Send 1 to 50 expenses.');
 if (typeof input.message_id !== 'string' || input.message_id.length<1 || input.message_id.length>256) throw new Error('Supply the original message_id.');
 const entries=input.expenses.map((item,i)=>{
  try {
   const rupees=typeof item?.amount==='string' && /^\d+(\.\d{1,2})?$/.test(item.amount) ? Number(item.amount) : item?.amount;
   const amount_paise=Math.round(rupees*100);
   if (typeof rupees!=='number' || Math.abs(amount_paise/100-rupees)>1e-9) throw new Error('Amount must be a number in rupees with at most two decimals.');
   return validateEntry({...item,amount_paise,date:item.date ?? today});
  } catch (e) {
   throw new Error('Expense '+(i+1)+': '+e.message);
  }
 });
 return {message_id:input.message_id, entries};
}

/** True when rows already saved for a message ID (ordered by line) match the incoming entries exactly. */
export function sameEntries(saved, entries) {
 return saved.length===entries.length && saved.every((row,i)=>
  ['amount_paise','date','description','category'].every(key=>row[key]===entries[i][key]) && (row.bank ?? null)===entries[i].bank);
}
