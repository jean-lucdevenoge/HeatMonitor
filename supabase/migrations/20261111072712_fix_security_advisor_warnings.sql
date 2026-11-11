/*
# Fix Security Advisor Warnings

## Summary
Resolves 9 of 11 security advisor warnings by:
1. Moving the `pg_net` extension from the `public` schema to the `extensions` schema.
2. Dropping 4 orphaned SECURITY DEFINER functions that were callable by both `anon` and `authenticated` roles and referenced tables that do not exist in this database.

## Warnings Addressed
- `extension_in_public`: pg_net was installed in `public`, now moved to `extensions`.
- `anon_security_definer_function_executable` (4 functions): dropped orphaned functions.
- `authenticated_security_definer_function_executable` (4 functions): same functions dropped.

## Functions Dropped (all orphaned — referencing non-existent tables)
1. `create_notification_with_timestamp` — referenced `notifications` table (does not exist).
2. `increment_faq_vote` — referenced `faqs` table (does not exist).
3. `is_web_admin` — referenced `user_settings` table (does not exist).
4. `mark_invitation_used` — referenced `member_invitations` and `companies` tables (do not exist).

None of these functions are called from the application code (no RPC calls in the frontend).

## pg_net Extension
The `pg_net` extension is not used by any database function in the `public` schema.
Moving it to the `extensions` schema removes it from the exposed API surface while
keeping it available if needed in the future.

## Warnings NOT Addressed (platform-level, not fixable via SQL)
- `auth_otp_long_expiry`: Auth OTP expiry is a Supabase Auth config setting, not a database migration. It must be changed in the Supabase Dashboard under Authentication > Settings.
- `vulnerable_postgres_version`: The Postgres version upgrade is a platform-level operation performed by Supabase, not via migration.

## Security Changes
- Extension relocation: `pg_net` moved from `public` to `extensions` schema.
- EXECUTE privileges on dropped functions are removed automatically with the functions.
- No RLS policy changes needed (no tables were modified).
*/

-- 1. Move pg_net extension from public to extensions schema
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Drop orphaned SECURITY DEFINER functions
-- These reference tables that don't exist in this database and are not called by the app.
DROP FUNCTION IF EXISTS public.create_notification_with_timestamp(p_user_id uuid, p_title text, p_message text, p_type text, p_action_url text, p_is_read boolean, p_created_at timestamp with time zone);
DROP FUNCTION IF EXISTS public.increment_faq_vote(faq_id uuid, is_helpful boolean);
DROP FUNCTION IF EXISTS public.is_web_admin(user_id uuid);
DROP FUNCTION IF EXISTS public.mark_invitation_used(invitation_token text);
