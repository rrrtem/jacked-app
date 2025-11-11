# How to Apply Warm-up Exercises Migration

## Overview

This migration replaces all existing warm-up exercises in the database with a new comprehensive set of 60 simple warm-up exercises.

## File Location

```
db/migration_replace_warmup_exercises.sql
```

## What This Migration Does

1. **Deletes** all existing exercises where `exercise_type = 'warmup'`
2. **Inserts** 60 new warm-up exercises organized in 3 parts:
   - Part 1: Basic Movements (20 exercises)
   - Part 2: Twists, Yoga & Wrists (20 exercises)
   - Part 3: More Movements (20 exercises)
3. **Verifies** the migration by counting and displaying all new warm-up exercises

## Exercise Categories

All new warm-up exercises are categorized with:
- **exercise_type**: 'warmup'
- **movement_pattern**: 'compound' or 'isolation'
- **muscle_group**: full_body, shoulders, core, legs, arms, back, or chest

## ⚠️ Important Warning

**This migration will DELETE all existing warm-up exercises!**

If users have workout history or personal records associated with warm-up exercises, those references will be affected. Consider the following:

### If You Want to Preserve Workout History

1. Before running the migration, backup your database:
```sql
-- Create a backup of exercises table
CREATE TABLE exercises_backup AS SELECT * FROM exercises WHERE exercise_type = 'warmup';

-- Create backup of related records
CREATE TABLE workout_session_exercises_backup AS 
SELECT wse.* FROM workout_session_exercises wse
JOIN exercises e ON e.id = wse.exercise_id
WHERE e.exercise_type = 'warmup';
```

2. Modify the DELETE statement in the migration file to handle references manually.

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `db/migration_replace_warmup_exercises.sql`
5. Paste into the editor
6. Click **Run** to execute

### Option 2: Via psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i db/migration_replace_warmup_exercises.sql
```

### Option 3: Via Supabase CLI

```bash
# If you're using Supabase locally
supabase db reset  # This will reset and reapply all migrations

# Or push just this migration
supabase db push
```

## Verification

After running the migration, verify the results:

```sql
-- Count warm-up exercises (should be 60)
SELECT COUNT(*) FROM exercises WHERE exercise_type = 'warmup';

-- View all warm-up exercises grouped by muscle group
SELECT muscle_group, COUNT(*) as count
FROM exercises 
WHERE exercise_type = 'warmup'
GROUP BY muscle_group
ORDER BY count DESC;

-- View sample exercises
SELECT name, muscle_group, movement_pattern 
FROM exercises 
WHERE exercise_type = 'warmup'
ORDER BY name
LIMIT 10;
```

## Expected Results

- **Total warm-up exercises**: 60
- **Muscle group distribution**:
  - full_body: ~13 exercises
  - legs: ~16 exercises
  - shoulders: ~8 exercises
  - core: ~10 exercises
  - arms: ~7 exercises
  - back: ~4 exercises
  - chest: ~2 exercises

## Rollback

If you need to rollback this migration:

```sql
-- Delete new warm-up exercises
DELETE FROM exercises WHERE exercise_type = 'warmup';

-- Restore from backup (if you created one)
INSERT INTO exercises 
SELECT * FROM exercises_backup;

-- Clean up backup table
DROP TABLE exercises_backup;
```

## Post-Migration

After successfully applying the migration:

1. Test the warm-up exercises in the app
2. Verify they appear correctly in the exercise selector
3. Check that workout sessions can use the new warm-up exercises
4. Update any frontend filters or categories if needed

## All Exercise Names

Here's the complete list of 60 new warm-up exercises:

**Part 1: Basic Movements**
1. Head Turns
2. Head Circles
3. Shoulder Shrugs
4. Shoulder Circles
5. Arm Swings
6. Torso Twists
7. Side Bends
8. Forward Bends
9. Hip Circles
10. Squats
11. Lunges in Place
12. Heel Raises
13. Jumping Jacks
14. Leg Swings Forward-Back
15. Knee Circles
16. Ankle Circles
17. Marching in Place
18. Arms Behind Back Stretch
19. Seated Toe Touch
20. Shake Out Arms and Legs

**Part 2: Twists, Yoga & Wrists**
21. Wrist Circles
22. Wrist Flexion
23. Cat-Cow Pose
24. Child's Pose
25. Seated Twist
26. Lying Twist
27. Downward Dog
28. Cobra Pose
29. Mountain Pose
30. Tree Pose
31. Single Leg Forward Bend
32. Standing Twist with Arms
33. Prayer Hands
34. Interlaced Wrist Stretch
35. Warrior 1 Pose
36. Easy Side Plank
37. Twist on Hands and Knees
38. Butterfly Sitting
39. Shake Out Wrists
40. Happy Baby Pose

**Part 3: More Movements**
41. Arm Crossovers
42. High Knees
43. Butt Kicks
44. Side Steps
45. Arm Circles Forward
46. Arm Circles Backward
47. Toe Touches Alternating
48. Wall Push-ups
49. Calf Stretches
50. Quad Stretch
51. Neck Side Stretch
52. Finger Spreads
53. Elbow Circles
54. Standing Side Leg Lifts
55. Chest Opener Stretch
56. Figure 4 Hip Stretch
57. Spinal Rolls
58. Wrist Prayer Stretch
59. Ankle Pumps
60. Full Body Stretch

## Questions?

If you encounter any issues during migration, check:
1. Database connection is active
2. You have necessary permissions (superuser or table owner)
3. No other transactions are blocking the exercises table
4. Backup your data before proceeding if unsure

