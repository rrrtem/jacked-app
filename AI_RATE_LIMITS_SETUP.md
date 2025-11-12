# AI Rate Limits Setup Guide

## Overview

The AI workout generation feature now includes rate limiting to prevent excessive API costs:
- **Default users**: 3 requests per day
- **Special users** (phrrrtem@gmail.com): 10 requests per day

## Database Migration

Run the following SQL migration to add rate limit fields to the `users` table:

```sql
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

-- Add comments
COMMENT ON COLUMN users.ai_daily_limit IS 'Daily limit for AI workout generation requests (default: 3, special users: 10)';
COMMENT ON COLUMN users.ai_requests_count IS 'Number of AI requests used today';
COMMENT ON COLUMN users.ai_requests_reset_at IS 'Timestamp when the daily counter was last reset';
```

### Applying the Migration

**Option 1: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration from `db/migrations/add_ai_request_limits.sql`
4. Click "Run"

**Option 2: Via CLI**
```bash
# If using Supabase CLI
supabase db execute --file db/migrations/add_ai_request_limits.sql
```

## Features

### 1. Rate Limiting
- Checks user's daily limit before each AI generation
- Automatically resets counter after 24 hours
- Returns 429 status code when limit is exceeded

### 2. UI Counter
- Displays remaining requests (e.g., "3/10" or "0/3")
- Shows in the AI suggested tab, above the input field
- Updates in real-time after each generation

### 3. Persistent Storage
- AI-generated workouts are saved to localStorage
- Automatically loads last generation when returning to AI tab
- Only clears after completing the workout (not when closing the app)
- Expires after 24 hours

### 4. Workout Completion
- AI generation is cleared from localStorage only after:
  - User finishes the workout
  - Clicks "close" on the finished screen
- This prevents accidental loss of generated workouts

## API Endpoints

### POST /api/ai-generate-workout
- Generates AI workout
- Checks and increments rate limit
- Returns rate limit info in response

**Response (success)**:
```json
{
  "success": true,
  "data": {
    "exercises": [...],
    "overallReasoning": "..."
  },
  "rateLimit": {
    "remaining": 2,
    "limit": 3
  }
}
```

**Response (limit exceeded)**:
```json
{
  "error": "Daily AI request limit reached",
  "remaining": 0,
  "limit": 3,
  "resetAt": "2024-01-02T00:00:00.000Z"
}
```
Status code: 429

### GET /api/ai-limit-status
- Returns current rate limit status without incrementing
- Used to display counter in UI

**Response**:
```json
{
  "allowed": true,
  "remaining": 3,
  "limit": 10,
  "resetAt": "2024-01-02T00:00:00.000Z"
}
```

## Code Structure

### New Files
- `lib/ai-suggest/rate-limiter.ts` - Rate limiting logic
- `lib/ai-suggest/storage.ts` - localStorage management
- `app/api/ai-limit-status/route.ts` - Status endpoint
- `db/migrations/add_ai_request_limits.sql` - Database migration

### Modified Files
- `app/api/ai-generate-workout/route.ts` - Added rate limit check
- `app/start/page.tsx` - Added UI counter and localStorage integration
- `app/workout/[id]/FinishedStage.tsx` - Added clearAIGeneration on close

## Testing

### Test Rate Limit
1. Generate 3 workouts (or 10 if using phrrrtem@gmail.com)
2. Try to generate another - should show error
3. Counter should show "0/3" (or "0/10")

### Test Persistence
1. Generate a workout
2. Close the browser/tab
3. Reopen the app and go to AI suggested tab
4. Workout should still be there

### Test Clearing
1. Generate a workout
2. Click "start" and complete the workout
3. Click "close" on finished screen
4. Go back to AI suggested tab
5. Workout should be cleared

## Updating Limits

To change a user's limit:

```sql
-- Give user 20 requests per day
UPDATE users 
SET ai_daily_limit = 20 
WHERE email = 'user@example.com';

-- Reset to default (3)
UPDATE users 
SET ai_daily_limit = 3 
WHERE email = 'user@example.com';
```

## Monitoring

Check current usage:

```sql
-- See all users with their limits and usage
SELECT 
  email,
  ai_daily_limit,
  ai_requests_count,
  ai_requests_reset_at
FROM users
WHERE ai_daily_limit IS NOT NULL
ORDER BY ai_requests_count DESC;
```

## Troubleshooting

### Counter not showing
- Make sure database migration is applied
- Check browser console for errors
- Verify `/api/ai-limit-status` endpoint is accessible

### Limit not resetting
- Counter resets automatically after 24 hours
- Check `ai_requests_reset_at` timestamp in database
- Manual reset:
```sql
UPDATE users 
SET ai_requests_count = 0, 
    ai_requests_reset_at = NOW() 
WHERE email = 'user@example.com';
```

### Generated workout not persisting
- Check browser localStorage
- Key: `ai-workout-generation`
- Should contain JSON with exercises, reasoning, context, timestamp

