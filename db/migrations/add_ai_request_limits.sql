-- Add AI request limit fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_daily_limit INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS ai_requests_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_requests_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Set special limit for phrrrtem@gmail.com
UPDATE users 
SET ai_daily_limit = 10 
WHERE email = 'phrrrtem@gmail.com';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comment
COMMENT ON COLUMN users.ai_daily_limit IS 'Daily limit for AI workout generation requests (default: 3, special users: 10)';
COMMENT ON COLUMN users.ai_requests_count IS 'Number of AI requests used today';
COMMENT ON COLUMN users.ai_requests_reset_at IS 'Timestamp when the daily counter was last reset';

