# Expense tracker

A single-user Next.js expense tracker backed by Supabase (Auth + Postgres). Amounts are stored as integer paise.

## Local development

`npm ci`, then `npm run dev`. No environment variables, Supabase project or login are needed: in development the app opens straight to the dashboard and keeps expenses in `.dev-data.json` (git-ignored; delete it to reset). `/login` redirects to `/`.

`npm test` runs validation and database tests. `npm run build` type-checks and builds.

## Setup and production

- Run `supabase/001_expenses.sql` once on a fresh project. It is not an idempotent migration.
- Create your user in the Supabase dashboard, then turn off public sign-ups (Auth settings).
- Production shows a plain email/password login at `/login`. To change your password, use the Supabase dashboard.
- Git auto-deploy is disabled in `vercel.json`; deploy with the Vercel CLI.
