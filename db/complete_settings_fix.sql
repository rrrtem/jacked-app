-- Complete fix for Settings page
-- Run this in Supabase SQL Editor

-- Step 1: Add missing columns (if not already done)
ALTER TABLE users ADD COLUMN IF NOT EXISTS progression_config TEXT DEFAULT 'standard-linear';
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_preferences TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_workouts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_weight_lifted DECIMAL(10,2) DEFAULT 0;

-- Step 2: Add INSERT policy for users table (CRITICAL!)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 3: Verify all policies exist
-- You should see: SELECT, UPDATE, INSERT policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd;

-- Expected output:
-- "Users can insert own profile" | INSERT
-- "Users can view own profile"   | SELECT  
-- "Users can update own profile" | UPDATE

-- Step 4: Check if your user record exists
-- SELECT id, email, name FROM users WHERE id = auth.uid();
-- If this returns empty, your user record doesn't exist yet
-- The INSERT policy will allow upsert to create it automatically

