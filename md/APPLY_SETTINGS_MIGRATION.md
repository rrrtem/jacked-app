# Apply Settings Migration

## Overview

To enable the new Settings page functionality, you need to apply the database migration that adds user preferences fields.

## Migration File

`db/migration_user_preferences.sql`

## What It Does

Adds two new columns to the `users` table:
- `progression_config` (TEXT) - Stores the selected progression logic configuration
- `training_preferences` (TEXT) - Stores free-form training approach description

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `db/migration_user_preferences.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)
7. Verify success message appears

### Option 2: Supabase CLI

```bash
# Navigate to project root
cd /Users/fixed/Cursor/99

# Apply migration using Supabase CLI
supabase db push
```

### Option 3: Direct SQL

```sql
-- Copy and run this in your database:
ALTER TABLE users ADD COLUMN IF NOT EXISTS progression_config TEXT DEFAULT 'standard-linear';
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_preferences TEXT DEFAULT NULL;

COMMENT ON COLUMN users.progression_config IS 'Progression logic configuration ID (e.g. standard-linear, aggressive-linear, etc.)';
COMMENT ON COLUMN users.training_preferences IS 'Free text field for user training approach and preferences';
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check that columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('progression_config', 'training_preferences');
```

Expected output:
```
column_name           | data_type | column_default
----------------------|-----------|----------------
progression_config    | text      | 'standard-linear'
training_preferences  | text      | NULL
```

## Testing the Settings Page

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:3000`

3. Click the **Settings icon** (gear) in top-right corner

4. Verify you can:
   - See your name and email
   - Select different progression configurations
   - Enter training preferences
   - Save changes successfully
   - Logout

## Rollback (if needed)

If you need to undo this migration:

```sql
ALTER TABLE users DROP COLUMN IF EXISTS progression_config;
ALTER TABLE users DROP COLUMN IF EXISTS training_preferences;
```

## Notes

- The migration uses `IF NOT EXISTS` so it's safe to run multiple times
- Default value for `progression_config` is `'standard-linear'`
- Default value for `training_preferences` is `NULL`
- No data loss - only adds new columns
- Row Level Security (RLS) policies automatically apply to new columns

## Troubleshooting

### Error: "permission denied for table users"

**Solution**: Make sure you're running the migration with proper admin/owner privileges.

### Error: "column already exists"

**Solution**: The migration has already been applied. No action needed.

### Settings not saving

**Solution**: 
1. Check browser console for errors
2. Verify RLS policies allow users to update their own records
3. Check Supabase logs for database errors

## Related Files

- Migration: `db/migration_user_preferences.sql`
- Types: `lib/types/database.ts`
- Settings Page: `app/settings/page.tsx`
- Schema Docs: `db/DATABASE_SCHEMA.md`
- Feature Docs: `md/SETTINGS_PAGE.md`


