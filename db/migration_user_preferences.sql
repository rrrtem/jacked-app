-- Migration: Add user preferences for progression and training approach
-- Created: 2025-11-10

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS progression_config TEXT DEFAULT 'standard-linear';
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_preferences TEXT DEFAULT NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN users.progression_config IS 'Progression logic configuration ID (e.g. standard-linear, aggressive-linear, etc.)';
COMMENT ON COLUMN users.training_preferences IS 'Free text field for user training approach and preferences';

-- Optional: Add constraint to validate progression_config values
-- ALTER TABLE users ADD CONSTRAINT valid_progression_config 
-- CHECK (progression_config IN (
--   'standard-linear', 
--   'aggressive-linear', 
--   'conservative-linear', 
--   'light-weight-linear',
--   'standard-percentage',
--   'high-volume-percentage',
--   'beginner-percentage',
--   'advanced-percentage'
-- ));


