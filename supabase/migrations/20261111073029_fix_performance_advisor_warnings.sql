/*
# Fix Performance Advisor Warnings

## Summary
Resolves 5 performance advisor findings:
1. Drops 2 unused indexes on `created_at` columns that the app never queries by.
2. Removes 3 redundant permissive SELECT policies that overlap with `public`-scoped policies.

## Unused Indexes Dropped
- `idx_heating_data_created_at` on `heating_data` — the app filters/orders by `date` and `time`, never by `created_at`.
- `idx_house_heating_calculations_created_at` on `house_heating_calculations` — the app filters/orders by `date`, never by `created_at`.

## Redundant Policies Removed
Each of the 3 tables had two permissive SELECT policies for the `authenticated` role:
  a) "Authenticated users can read ..." (TO authenticated, USING true)
  b) "Enable read access for all users" (TO public, USING true)

Since `public` includes `authenticated`, policy (b) already covers authenticated users.
Policy (a) is redundant and forces Postgres to evaluate both policies on every query.

Dropped policies:
- "Authenticated users can read energy calculations" on `energy_calculations`
- "Authenticated users can read heating data" on `heating_data`
- "Authenticated users can read house heating calculations" on `house_heating_calculations`

The "Enable read access for all users" (TO public) policy remains on each table,
preserving the same access behavior with better performance.

## Security Impact
None. Access semantics are unchanged — all roles retain the same SELECT access.
The redundant `authenticated`-only SELECT policies added no additional restriction.
*/

-- 1. Drop unused indexes
DROP INDEX IF EXISTS public.idx_heating_data_created_at;
DROP INDEX IF EXISTS public.idx_house_heating_calculations_created_at;

-- 2. Drop redundant authenticated SELECT policies (the public policy already covers authenticated)
DROP POLICY IF EXISTS "Authenticated users can read energy calculations" ON public.energy_calculations;
DROP POLICY IF EXISTS "Authenticated users can read heating data" ON public.heating_data;
DROP POLICY IF EXISTS "Authenticated users can read house heating calculations" ON public.house_heating_calculations;
