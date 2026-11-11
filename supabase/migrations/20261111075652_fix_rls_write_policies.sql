-- Remove permissive write policies and revoke write grants from anon/authenticated.
-- Edge functions use the service_role key which bypasses RLS, so writes still work.
-- Reads remain open (TO public, USING true) since this is a no-auth app.

-- ===== heating_data =====
DROP POLICY IF EXISTS "Users can delete heating data" ON public.heating_data;
DROP POLICY IF EXISTS "Users can insert heating data" ON public.heating_data;
DROP POLICY IF EXISTS "Users can update heating data" ON public.heating_data;

REVOKE INSERT, UPDATE, DELETE ON public.heating_data FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.heating_data FROM authenticated;

-- ===== energy_calculations =====
DROP POLICY IF EXISTS "System can insert energy calculations" ON public.energy_calculations;
DROP POLICY IF EXISTS "System can update energy calculations" ON public.energy_calculations;

REVOKE INSERT, UPDATE, DELETE ON public.energy_calculations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.energy_calculations FROM authenticated;

-- ===== house_heating_calculations =====
DROP POLICY IF EXISTS "Authenticated users can insert house heating calculations" ON public.house_heating_calculations;
DROP POLICY IF EXISTS "System can update house heating calculations" ON public.house_heating_calculations;

REVOKE INSERT, UPDATE, DELETE ON public.house_heating_calculations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.house_heating_calculations FROM authenticated;
