# Supabase migration sync notes

Production and the repository do not currently have a 1:1 historical migration timeline.

## Production is authoritative

Do not run a blind `supabase db push` against production until the historical migration timeline is reconciled. Production contains migrations with timestamps/names that differ from older files in this repository, especially the kitchen changes from September 2026.

## Pre-launch fix

The production fixes represented by:

- `20260925153000_pre_lancamento_seguranca_whatsapp.sql`

were first applied directly to production during the pre-launch audit and then versioned in Git. The SQL was written to be safe to re-evaluate where possible, but migration history should not be inferred only from the presence of the file.

## Rule for new work

1. Treat the live production schema as the source of truth.
2. Create new migrations with timestamps later than the current production history.
3. Validate changes in a branch/preview database before applying them to production.
4. Never rename or replay historical production migrations simply to make filenames match.
5. Reconcile the old timeline separately using a schema pull/diff and manual review.

## Why

The production database contains valid changes that were applied through more than one workflow during development. Replaying differently named historical files can produce duplicate objects, constraints, policies, triggers, or data changes even when the final live schema is correct.
