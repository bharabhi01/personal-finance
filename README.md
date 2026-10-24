# Expense tracker

A single-user Next.js expense tracker backed by Supabase (Auth + Postgres). You message Instinct AI an expense ("Claude Subscription Rs 2300 Kotak Bank"), Instinct saves it through this app's API, and the dashboard shows it. Amounts are stored as integer paise.

## Local development

`npm ci`, then `npm run dev` (Node 22.18 or newer). No environment variables, Supabase project or login are needed: in development the app opens straight to the dashboard and keeps expenses in `.dev-data.json` (git-ignored; seeded with sample data on first run; delete it to reset). `/login` redirects to `/`.

`npm test` runs validation, summary and database tests. `npm run build` type-checks and builds.

## Setup and production

1. In Supabase, run `supabase/001_expenses.sql`, then `supabase/002_bank_and_subscriptions.sql`, once each and in order. They are not idempotent. (If 001 already ran, run only 002.)
2. Create your user in the Supabase dashboard, then turn off public sign-ups (Auth settings). Copy the user's UUID.
3. Set the variables in `.env.example` in Vercel: the Supabase URL and anon key, plus `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_USER_ID` (the UUID) and `INSTINCT_API_KEY` (any long random string, e.g. `openssl rand -hex 32`).
4. Production shows an email/password login at `/login`. To change your password, use the Supabase dashboard.
5. Git auto-deploy is disabled in `vercel.json`; deploy with the Vercel CLI.

## Instinct AI integration

`POST https://<your-app>/api/instinct/expenses` with `Authorization: Bearer <INSTINCT_API_KEY>` and a JSON body:

```json
{
  "message_id": "<unique ID of the WhatsApp message>",
  "expenses": [
    { "amount": 2300, "description": "Claude Subscription", "category": "Subscriptions", "bank": "Kotak Bank", "date": "2026-10-24" }
  ]
}
```

- `amount` is in rupees (at most two decimals). `description` and `category` are required; `bank` and `date` (YYYY-MM-DD, defaults to today in IST) are optional.
- `category` must be one of: Food, Travel, Shopping, Bills, Health, Subscriptions, Other. Recurring services such as Claude or Netflix go under Subscriptions; they populate "My subscriptions".
- One message may carry 1 to 50 expenses and is saved all-or-nothing.
- Success is `201 {"status":"saved","expenses":[…]}`. Confirm to the user only after this response.
- Sending the same `message_id` and contents again returns `200 {"status":"already_saved"}` and saves nothing, so retries are safe. The same `message_id` with different contents is rejected.
- Errors are `4xx {"error":"…"}` with a message that says what to fix, so Instinct can ask the user a question instead of guessing.

## Notes

Server validation and database constraints check amounts, descriptions, dates and categories; row-level security keeps each user's rows separate. Before a release, verify live login/logout, a real Instinct save and retry, and the exports, using a test account kept separate from the real ledger.
