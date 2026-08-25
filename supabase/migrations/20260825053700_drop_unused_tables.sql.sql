/*
# Drop Unused Tables

## Overview
This migration removes 14 tables that belonged to a SaaS/ticketing/marketplace template
that is not used by this energy/heating analytics app. None of these tables are referenced
anywhere in the frontend code or remaining edge functions.

## Tables Being Dropped (all in public schema)
1. `bids` - marketplace bidding system
2. `companies` - company directory
3. `faqs` - FAQ knowledge base
4. `faq_votes` - FAQ voting system
5. `invoices` - billing invoices
6. `member_invitations` - team member invitations
7. `notifications` - user notifications
8. `project_attachments` - project file attachments
9. `projects` - project management
10. `subscription_plans` - subscription tier definitions
11. `subscriptions` - active subscriptions
12. `support_tickets` - support ticket system
13. `support_ticket_responses` - support ticket replies
14. `user_companies` - user-company mapping
15. `user_settings` - user preference storage
16. `users` - custom user profiles (auth.users is separate and untouched)

## Tables Kept (NOT dropped)
- `heating_data` - core heating measurement data
- `energy_calculations` - energy calculation results
- `house_heating_calculations` - house heating calculation results

## What Gets Removed Automatically
- All indexes on these tables
- All RLS policies on these tables
- All triggers on these tables
- All sequences owned by these tables
- All foreign key constraints referencing these tables

## Security
No security changes to remaining tables. RLS policies on dropped tables are removed with the tables.

## Important Notes
1. All 14 tables have 0 rows of data (verified before dropping).
2. CASCADE is used to handle any remaining foreign key dependencies between the dropped tables.
3. The auth.users table (Supabase managed) is NOT touched.
*/

DROP TABLE IF EXISTS public.support_ticket_responses CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.faq_votes CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.project_attachments CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.bids CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.member_invitations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_companies CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
