# Migrations

Deliberately empty (TASK-005). Laravel 13's default scaffolding migrations
(`users`/`password_reset_tokens`/`sessions`, `cache`/`cache_locks`,
`jobs`/`job_batches`/`failed_jobs`) were reviewed and removed before ever
being run — the database was confirmed empty first. See
`backend/database/README.md` for the disposition reasoning and
`docs/implementation/CHANGELOG.md` (TASK-005) for the full record.

No application-domain tables exist yet. Identity/Tenancy (Phase 1) adds
the first real migrations, using the UUID/TIMESTAMPTZ conventions in
`backend/database/README.md`.
