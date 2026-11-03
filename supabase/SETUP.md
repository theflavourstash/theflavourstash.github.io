# Supabase setup

The app remains in device-only mode until both public environment variables are configured. Existing local data is never uploaded automatically.

1. Create a Supabase project. Apply `migrations/202611030001_workspace.sql` using its SQL editor (once), or Supabase migrations.
2. In Authentication URL Configuration, set Site URL to `https://theflavourstash.github.io/` and allow that URL as a redirect. Enable email/password sign-in and email confirmation. Configure email delivery for reliable confirmation messages.
3. In the GitHub repository's Settings > Secrets and variables > Actions > Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project's Connect dialogue. These values are public client configuration. Never use a secret or service-role key.
4. Re-run Deploy Flavour Lab. For local development, copy `.env.example` to `.env.local`, set those same two values and restart Vite.
5. In the app's Settings, create an account, confirm the email and sign in. Use Import original device collection on the device where your inventory was saved, or import a JSON backup. Review the replacement confirmation first. Import replaces this account's entire collection.
6. Sign in on another device and use Refresh cloud collection to load changes. Export backups periodically.

## Storage and concurrency

Each account owns one JSONB workspace containing flavours, recipes, ratings, comments and batches. RLS permits only the owner to read it. Authenticated users cannot write the table directly. The `save_workspace` RPC derives ownership from the authenticated JWT, and atomically compares the expected revision before replacing the document. This makes a batch deduction and its history entry indivisible and rejects stale changes from another device. Both simultaneous first saves and repeated writes with the same revision are rejected.

The client performs recipe calculation and validation. The server checks basic document shape and non-negative stock, but does not independently recalculate recipes. This is a private inventory, not a shared marketplace. Editing one's own data directly cannot affect other accounts.

Cloud writes require a connection. A failed or ambiguous request blocks further writes until a refresh, so the user can inspect batch history before retrying. There is no offline write queue or automatic merge. Cloud collections are held in memory, not copied to the old localStorage key; Supabase stores the sign-in session locally. Signing out clears the in-memory collection and editors. The original local collection remains available for explicit migration/export.

## Verification

`npm test` runs calculation tests and the actual SQL migration in PGlite/Postgres, checking unauthenticated access, owner isolation, forbidden direct writes, revision conflicts, negative stock rejection and atomic batch/undo updates. Live auth and cross-device tests still require a configured Supabase project.
