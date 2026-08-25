/*
# Drop Unused Database Functions

## Overview
This migration removes stored functions that belonged to a ticketing/invitation/FAQ/admin system
that is not used by this energy/heating analytics app. None of these functions are called from
the frontend or any remaining edge function.

## Functions Being Dropped (all in public schema)
1. `create_notification_with_timestamp` - notification creation helper
2. `generate_invitation_token` - token generation for member invitations
3. `generate_ticket_number` - support ticket number generator
4. `get_company_members_with_details` - company member lookup
5. `get_max_ticket_number` - ticket number max lookup
6. `get_next_ticket_number` - ticket number sequence
7. `get_pending_invitations_with_inviter` - invitation listing
8. `get_pending_invitations_with_inviter_name` - invitation listing variant
9. `increment_faq_vote` - FAQ voting increment
10. `is_web_admin` - admin role check
11. `mark_invitation_used` - invitation consumption
12. `update_ticket_on_response` - ticket status trigger (CASCADE drops its trigger too)
13. `validate_invitation_token` - invitation token validation
14. `update_updated_at_column` - generic updated_at trigger function (CASCADE drops dependent triggers; these are on tables being dropped in the next migration anyway)

## Functions Kept (NOT dropped)
- `calculate_house_heating_all` - used by calculate-house-heating edge function
- `calculate_house_heating_for_date_range` - date-range variant
- `update_energy_calculations_updated_at` - trigger function for energy_calculations table
- `update_house_heating_calculations_updated_at` - trigger function for house_heating_calculations table

## Security
No security changes. Only removing unused functions.
*/

DROP FUNCTION IF EXISTS public.create_notification_with_timestamp();
DROP FUNCTION IF EXISTS public.generate_invitation_token();
DROP FUNCTION IF EXISTS public.generate_ticket_number();
DROP FUNCTION IF EXISTS public.get_max_ticket_number();
DROP FUNCTION IF EXISTS public.get_next_ticket_number();
DROP FUNCTION IF EXISTS public.get_company_members_with_details(uuid);
DROP FUNCTION IF EXISTS public.get_pending_invitations_with_inviter(uuid);
DROP FUNCTION IF EXISTS public.get_pending_invitations_with_inviter_name(uuid);
DROP FUNCTION IF EXISTS public.increment_faq_vote(uuid);
DROP FUNCTION IF EXISTS public.is_web_admin();
DROP FUNCTION IF EXISTS public.mark_invitation_used(uuid, text);
DROP FUNCTION IF EXISTS public.update_ticket_on_response() CASCADE;
DROP FUNCTION IF EXISTS public.validate_invitation_token(text);
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
