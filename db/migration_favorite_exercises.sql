-- Migration: Add favorite_exercises table
-- This table stores user's favorite exercises

-- Create favorite_exercises table
CREATE TABLE IF NOT EXISTS favorite_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: user can favorite each exercise only once
  UNIQUE(user_id, exercise_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorite_exercises_user_id 
  ON favorite_exercises(user_id);

CREATE INDEX IF NOT EXISTS idx_favorite_exercises_exercise_id 
  ON favorite_exercises(exercise_id);

-- Enable Row Level Security
ALTER TABLE favorite_exercises ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorite_exercises
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON favorite_exercises
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove favorites
CREATE POLICY "Users can remove favorites"
  ON favorite_exercises
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE favorite_exercises IS 'Stores user favorite exercises';

