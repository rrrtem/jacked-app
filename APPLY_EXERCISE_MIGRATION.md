# Apply Exercise Favorites Migration

## ⚠️ Important: You need to apply this migration for the exercise pages to work properly

The exercise pages are ready, but you need to create the `favorite_exercises` table in Supabase first.

## How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Migration**
   - Open the file: `db/migration_favorite_exercises.sql`
   - Copy all the content
   - Paste it into the SQL Editor
   - Click "Run" or press Cmd+Enter

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check "Table Editor" → You should see a new table called `favorite_exercises`

### Option 2: Via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

## What This Migration Does

Creates the `favorite_exercises` table with:
- User to exercise relationship
- Automatic timestamps
- Row Level Security (RLS) policies
- Unique constraint (user can favorite each exercise only once)
- Indexes for fast queries

## After Migration

Once applied, the exercise pages will work with full functionality:
- ✅ View all exercises with filters
- ✅ Add/remove exercises from favorites
- ✅ Filter to show only favorites
- ✅ View exercise details with records and progress

## Troubleshooting

### Error: "relation 'favorite_exercises' does not exist"
**Solution:** You haven't applied the migration yet. Follow the steps above.

### Error: "permission denied for table favorite_exercises"
**Solution:** The RLS policies might not be set correctly. Re-run the migration.

### Favorites not saving
**Solution:** 
1. Check that you're logged in
2. Check browser console for errors
3. Verify RLS policies are active in Supabase Dashboard

## Verify It's Working

After applying the migration:

1. Visit `/exercise` - should load exercise list
2. Click the heart icon - should toggle favorite
3. Click "favorites" filter - should show only favorited exercises
4. Click an exercise card - should open detail page
5. Click heart on detail page - should toggle favorite

---

**Current Status:** Migration file ready, waiting to be applied
**File:** `db/migration_favorite_exercises.sql`

