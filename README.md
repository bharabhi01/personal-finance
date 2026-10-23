# Expense tracker

Responsive Next.js expense app with Supabase authentication and Postgres. Supports manual add, edit, confirmed delete, filters, CSV export and reviewed chat import. The light dashboard includes a sidebar, daily spending chart and category filters, with layouts for mobile and desktop.

## Development

Use Node 22 or newer. Run `npm ci`, `npm test`, `npm run build`, then `npm start`. `/concept` shows interactive sample data that disappears on reload. Without database configuration, `/` shows a setup notice.

## Configuration

Copy `.env.example` to a local environment file and set the project's Supabase URL and publishable key. An existing anon key is supported as an alternative. Never put a service-role key in the app or commit environment files.

Optional username login uses three server-only variables: `LOGIN_ALIAS_USERNAME`, `LOGIN_ALIAS_EMAIL` and `LOGIN_ALIAS_USER_ID`. All must describe one existing authenticated identity. The alias is checked against the exact UUID and access list after password verification. Unknown usernames never generate accounts or email addresses. Do not prefix alias variables with `NEXT_PUBLIC_`.

`supabase/001_expenses.sql` is a one-time schema creation script, not an idempotent migration. Inspect the destination before applying it. Subsequent schema changes need reviewed migrations and backups. Add each permitted auth UUID to `public.allowed_users` through a trusted administrator. Public sign-up is not offered by the app.

## Security and data

Server-verified sessions and database RLS keep each user's expenses and imports isolated. Cookie-authenticated writes require same-origin requests. `/account` changes only the currently signed-in account's password through Supabase Auth.

INR amounts use integer paise. Dates are explicit expense dates. Server validation and database constraints check amounts, descriptions, dates and categories. The ledger loads all rows in stable ordered pages and suppresses partial totals on loading errors or count changes. Refresh fetches updates; there is no realtime subscription.

Reviewed chat imports use original message IDs and ordered rows. The database function saves imports and expenses atomically. Identical retries return `already_saved`, changed payloads for the same ID are rejected, and invalid rows roll back the batch. There is no automatic WhatsApp webhook. Use the authenticated review form and verify the resulting ledger before reporting a save.

## Testing and release

`npm test` covers validation, username resolution and a PostgreSQL-compatible database suite including access isolation, deduplication, rollback and edit/delete. `node tests/ui-check.mjs` checks responsive concept behavior using local Chrome. Build and TypeScript checks run with `npm run build`.

Before a release, verify live login/logout, owner access, cross-session persistence, database isolation, import retries, manual changes, exports and mobile/desktop layout. Test-account data must remain separate from the real ledger. Establish a backup/export path. Preview readiness alone is not a production release.

## Deployment workflow

Git auto-deploy is disabled in `vercel.json` so publishing source does not replace the existing production deployment. Use a reviewed Vercel CLI preview and promote it after verifying login and data access. Remove this setting only when switching deliberately to Git-based deployments. Existing production environment values stay in Vercel, not in this repository.
