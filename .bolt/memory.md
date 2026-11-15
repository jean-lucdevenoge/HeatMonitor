# Project memory

## Product intent & audience

- App with nightly email import and house heating calculation features
- Uses Supabase backend (Edge Functions, cron scheduler, auth keys)
- Likely personal/home utility tool focused on heating data derived from email sources

## Brand personality & voice

- Production-quality, polished presentation (per `.bolt/prompt` — not restated here)

## Visual design & UX direction

- Stack: Vite + React, JSX, Tailwind CSS, Lucide React icons
- No additional UI/theme/icon packages unless explicitly requested
- Designs should be distinctive and production-grade

## Decisions, constraints & rationale

- **Edge function auth pattern:**
  - `nightly-email-import`: accepts both anon key (Supabase cron scheduler) and service role key (direct server calls) — cron sends anon key, not service role
  - `data-writes` and `calculate-house-heating`: service-role-only — called server-to-server from the nightly importer
- **Cron schedule:** nightly at 2:00 AM UTC / 4:00 AM CET
- **Supabase scheduled functions:** platform sends anon key as Authorization header when triggering via cron
- Earlier security fix that rejected non-service-role requests broke the cron-triggered import (silent 401s); fixed by allowing anon key on cron-triggered function only

## Open questions & assumptions

- Exact relationship between imported emails and heating calculations not yet fully clear
- Full app scope and UI surfaces beyond backend functions still emerging
- Whether other edge functions will need cron-triggered (anon key) access in the future