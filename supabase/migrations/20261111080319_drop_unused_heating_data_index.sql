-- Drop unused and redundant index.
-- idx_heating_data_date_time_new duplicates the unique index heating_data_date_time_unique
-- on the same columns (date, time), so it adds overhead with no benefit.
DROP INDEX IF EXISTS public.idx_heating_data_date_time_new;
