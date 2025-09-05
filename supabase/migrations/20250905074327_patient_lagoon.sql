/*
  # Fix Date and Time Column Types

  1. Schema Changes
    - Change `date` column from TEXT to DATE type
    - Change `time` column from TEXT to TIME type
    - Add temporary columns for data conversion
    - Migrate existing data to proper formats
    - Drop old columns and rename new ones

  2. Data Migration
    - Convert existing DD.MM.YYYY text dates to proper DATE format
    - Convert existing HH:MM:SS text times to proper TIME format
    - Handle any invalid date/time values gracefully

  3. Index Updates
    - Recreate indexes on the new date/time columns
    - Ensure unique constraint still works with new types

  4. Important Notes
    - This migration will convert all existing data
    - Invalid dates/times will be set to NULL
    - Backup recommended before running this migration
*/

-- Step 1: Add new columns with proper types
ALTER TABLE heating_data 
ADD COLUMN new_date DATE,
ADD COLUMN new_time TIME;

-- Step 2: Convert existing data from DD.MM.YYYY to YYYY-MM-DD format
UPDATE heating_data 
SET new_date = CASE 
  WHEN date ~ '^\d{2}\.\d{2}\.\d{4}$' THEN
    TO_DATE(date, 'DD.MM.YYYY')
  WHEN date ~ '^\d{4}-\d{2}-\d{2}$' THEN
    TO_DATE(date, 'YYYY-MM-DD')
  ELSE NULL
END;

-- Step 3: Convert existing time data to proper TIME format
UPDATE heating_data 
SET new_time = CASE 
  WHEN time ~ '^\d{1,2}:\d{2}(:\d{2})?$' THEN
    CAST(time AS TIME)
  ELSE NULL
END;

-- Step 4: Drop the old unique constraint
ALTER TABLE heating_data DROP CONSTRAINT IF EXISTS heating_data_date_time_unique;

-- Step 5: Drop old columns
ALTER TABLE heating_data DROP COLUMN date;
ALTER TABLE heating_data DROP COLUMN time;

-- Step 6: Rename new columns
ALTER TABLE heating_data RENAME COLUMN new_date TO date;
ALTER TABLE heating_data RENAME COLUMN new_time TO time;

-- Step 7: Add NOT NULL constraints (after data is migrated)
ALTER TABLE heating_data ALTER COLUMN date SET NOT NULL;
ALTER TABLE heating_data ALTER COLUMN time SET NOT NULL;

-- Step 8: Recreate the unique constraint with proper types
ALTER TABLE heating_data ADD CONSTRAINT heating_data_date_time_unique UNIQUE (date, time);

-- Step 9: Recreate indexes for better performance
CREATE INDEX IF NOT EXISTS idx_heating_data_date_time_new ON heating_data (date, time);
CREATE INDEX IF NOT EXISTS idx_heating_data_date_new ON heating_data (date);

-- Step 10: Update the trigger function if it exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';