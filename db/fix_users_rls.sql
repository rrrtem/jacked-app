-- Fix RLS policies for users table to allow INSERT
-- This is needed for upsert operations in settings page

-- Add INSERT policy for users
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify policies exist
-- Run this to check:
-- SELECT schemaname, tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'users';

