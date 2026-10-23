export const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Other'];
export function validateEntry(input) {
 if (!input || typeof input !== 'object') throw new Error('Invalid expense.');
 const {amount_paise, date, description, category} = input;
 if (!Number.isSafeInteger(amount_paise) || amount_paise <= 0 || amount_paise > 100000000) throw new Error('Amount must be between ₹0.01 and ₹10,00,000.');
 if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+'T00:00:00Z')) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date) throw new Error('Use a real expense date.');
 if (typeof description !== 'string' || !description.trim() || description.trim().length>200) throw new Error('Description must be 1 to 200 characters.');
 if (!categories.includes(category)) throw new Error('Choose a valid category.');
 return {amount_paise,date,description:description.trim(),category};
}
export function validateBatch(input) {
 if (!input || !Array.isArray(input.entries) || input.entries.length<1 || input.entries.length>50) throw new Error('Import 1 to 50 entries.');
 if (typeof input.source_message_id !== 'string' || input.source_message_id.length<1 || input.source_message_id.length>256) throw new Error('Supply the original message ID.');
 const entries=input.entries.map(validateEntry);
 return {source_message_id:input.source_message_id, entries};
}
