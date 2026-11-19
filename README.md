# Expense tracker

A single-user Next.js expense tracker backed by Supabase (Auth + Postgres). You message Instinct AI an expense ("Claude Subscription Rs 2300 Kotak Bank"), income, investment, savings transfer or bank balance, Instinct saves it through this app's API, and the dashboard shows it. Amounts are stored as integer paise.

## Dashboard

- **Filters:** period (any month, last 3/6/9/12 months, all time) and expense category.
- **Balances:** each bank with a reported balance, the total, and the period's credit card spend (expenses on banks named "… Credit Card").
- **Where your income went:** expenses, investments and savings as a share of income for the period.
- **Tiles:** total spent, top category, savings and monthly subscriptions.
- **Charts and lists:** daily spending, category breakdown, recent expenses (edit, delete, CSV export), subscriptions, and income, investments, savings and balance entries.
- **Top bar:** icon buttons for the dark/light toggle, sign out (production only) and add expense. Dark mode is the default; the choice is remembered in the browser.
- Expenses can be added by hand. Income, investments, savings and balances are entered through Instinct and can be deleted on the dashboard.

## Local development

`npm ci`, then `npm run dev` (Node 22.18 or newer). No environment variables, Supabase project or login are needed: in development the app opens straight to the dashboard and keeps expenses in `.dev-data.json` (git-ignored; seeded with sample data on first run; delete it to reset). `/login` redirects to `/`.

`npm test` runs validation, summary and database tests. `npm run build` type-checks and builds.

## Setup and production

1. In Supabase, run `supabase/001_expenses.sql`, `002_bank_and_subscriptions.sql`, `003_transactions.sql`, `004_categories.sql`, `005_more_categories.sql` and `006_subscription_frequencies.sql` once each and in order. They are not idempotent, so on an existing project run only the ones not yet applied, after a backup.
2. Create your user in the Supabase dashboard, then turn off public sign-ups (Auth settings). Copy the user's UUID.
3. Set the variables in `.env.example` in Vercel: the Supabase URL and anon key, plus `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_USER_ID` (the UUID) and `INSTINCT_API_KEY` (any long random string, e.g. `openssl rand -hex 32`).
4. Production shows an email/password login at `/login`. To change your password, use the Supabase dashboard.
5. Pushing to `main` deploys to production automatically (the GitHub repo is connected to the Vercel project). To deploy the working folder without pushing, run `npx vercel deploy --prod`. `vercel.json` runs the server in Mumbai (`bom1`), next to the Supabase database (`ap-south-1`); keep the two in the same region, since every page load makes several database calls. Turn on Speed Insights once in the Vercel project's Speed Insights tab.

## Instinct AI integration

`POST https://<your-app>/api/instinct/entries` with `Authorization: Bearer <INSTINCT_API_KEY>` and a JSON body with a `message_id` and any of these lists (at least one entry, 50 at most in total):

```json
{
  "message_id": "<unique ID of the WhatsApp message>",
  "expenses":    [{ "amount": 2300, "description": "Claude Subscription", "category": "Subscriptions", "bank": "Kotak Bank", "date": "2026-10-24" }],
  "income":      [{ "amount": 150000, "description": "Salary", "bank": "Kotak Bank" }],
  "investments": [{ "amount": 20000, "description": "SIP 1", "bank": "Axis Bank" }],
  "savings":     [{ "amount": 30000, "from_bank": "Axis Bank", "to_bank": "Kotak Bank" }],
  "balances":    [{ "bank": "Kotak Bank", "amount": 85000 }]
}
```

- `amount` is in rupees (at most two decimals). `date` (YYYY-MM-DD) is optional and defaults to today in IST. `bank` is optional on expenses, income and investments, but then that money can't move a bank balance.
- Expense `category` must be one of: Housing, Bills, Food, Groceries, Shopping, Subscriptions, Travel, Health, EMI, Insurance, Family, Other (use Other only when nothing fits; Instinct should ask instead of guessing). Rent, electricity and furniture rent are Housing; credit card bills are Bills; Swiggy, Zomato and eating out are Food; groceries are Groceries; loan and no-cost EMI instalments are EMI; health, life, vehicle and other insurance premiums are Insurance; money given to or spent on family members is Family. Recurring services such as Claude or Netflix go under Subscriptions; they populate "My subscriptions", where each one's billing frequency (weekly, monthly, quarterly or yearly; monthly by default) can be changed to set its next due date and monthly cost.
- **Use one spelling per bank** ("Kotak Bank", not "Kotak" and "kotak bank" in different messages). Matching ignores case and surrounding spaces, but not other differences.
- `savings` is a transfer between your own banks. It moves money between the two bank balances and is never an expense. The Savings tile and the savings line on the income card show the amount left: the period's transfers into a savings bank, less the expenses, investments and transfers out of that bank since the first transfer.
- `balances` is the exact amount in a bank right now. From then on, the dashboard's balance for that bank moves with everything logged afterwards: income adds, expenses and investments subtract, a savings transfer subtracts from `from_bank` and adds to `to_bank`. Entries dated before the report, or entered before it, are treated as already included. Send a balance as its own message, not in the same message as entries that should change it.
- The dashboard shows expenses, investments and savings as a percentage of income for the selected period, so log income to see percentages. A transfer between your banks is not an expense: Savings there is what is left of the period's transfers into a savings bank after spending from it, so money spent from savings counts once, as an expense, and shrinks Savings.
- One message is saved all-or-nothing. Success is `201 {"status":"saved","entries":[…]}`; confirm to the user only after this response.
- Sending the same `message_id` and contents again returns `200 {"status":"already_saved"}` and saves nothing, so retries are safe. The same `message_id` with different contents is rejected.
- **Edit or delete an earlier entry** (same `Authorization` header). Find it with `GET /api/instinct/entries?q=<text in description>&kind=<kind>&date=<YYYY-MM-DD>&limit=<1-50, default 10>`, which returns `{"entries":[{"id","kind","amount","date","description","category","bank","to_bank","created_at"}]}` newest first. (A save response also carries each entry's `id`.) Then `PATCH /api/instinct/entries/<id>` with only the fields to change (`amount` in rupees, `description`, `category`, `bank` — `from_bank` for a savings row — `to_bank`, `date`) returns `{"status":"updated","entry":{…}}`; the entry's kind can't change. `DELETE /api/instinct/entries/<id>` returns `{"status":"deleted","entry":{…}}`. Instinct should show the matching entry and get a yes before deleting.
- Errors are `4xx {"error":"…"}` with a message that says what to fix, so Instinct can ask the user a question instead of guessing.

## Notes

Server validation and database constraints check amounts, descriptions, dates and categories; row-level security keeps each user's rows separate. Before a release, verify live login/logout, a real Instinct save and retry, and the exports, using a test account kept separate from the real ledger.
