# Workout URL and Local Storage Improvement

## Problem
- Workouts were using generic URL `/workout/1` which was meaningless
- No way to return to an active workout if the tab was accidentally closed
- Local Storage was used but not connected to specific workout URLs

## Solution
Implemented unique workout IDs with persistent URLs that allow users to return to active workouts.

## Changes Made

### 1. Start Page (`app/start/page.tsx`)
- **Generate unique workout ID**: When starting a workout, generate a unique ID using timestamp + random string
- **Save workout ID**: Store the ID in localStorage as `currentWorkoutId`
- **Redirect to unique URL**: Navigate to `/workout/[unique-id]` instead of `/workout/1`

```typescript
const workoutId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
localStorage.setItem("currentWorkoutId", workoutId)
window.location.href = `/workout/${workoutId}`
```

### 2. Workout Page (`app/workout/[id]/page.tsx`)
- **Get workout ID from URL**: Use `useParams()` to extract the workout ID from the URL
- **Validate workout ID**: On load, check if the URL ID matches the stored `currentWorkoutId`
- **Handle mismatches**: 
  - If IDs don't match and no exercise data exists → redirect to home
  - If exercise data exists → this is a new workout, update the stored ID
- **Save workout ID in state**: Include `workoutId` in the saved workout state
- **Clean up on finish/cancel**: Remove both `workoutState` and `currentWorkoutId` from localStorage

Key validation logic:
```typescript
const savedWorkoutId = localStorage.getItem("currentWorkoutId")

if (!savedWorkoutId || savedWorkoutId !== workoutIdFromUrl) {
  const hasExercises = localStorage.getItem("workoutExercises")
  if (!hasExercises) {
    router.push("/") // No data, redirect to home
    return
  }
  localStorage.setItem("currentWorkoutId", workoutIdFromUrl)
}
```

### 3. Home Page (`app/page.tsx`)
- **Check for active workout**: On mount and window focus, check for active workout in localStorage
- **Show "continue workout" button**: Display prominent button if an active workout exists
- **Navigate to active workout**: Button links to `/workout/[active-workout-id]`
- **Handle new workout**: Ask for confirmation before discarding an active workout

Features:
```typescript
// Check for active workout
const workoutId = localStorage.getItem("currentWorkoutId")
const workoutState = localStorage.getItem("workoutState")

if (workoutId && workoutState) {
  const state = JSON.parse(workoutState)
  if (state.stage !== "finished") {
    setActiveWorkoutId(workoutId)
  }
}
```

## User Experience Improvements

### Before
1. ❌ URL was `/workout/1` - meaningless and not unique
2. ❌ Closing the tab = lost workout progress
3. ❌ No way to return to an active workout
4. ❌ Starting a new workout could overwrite active one

### After
1. ✅ URL is `/workout/1731234567890-abc123xyz` - unique and persistent
2. ✅ Can close tab and reopen using the same URL
3. ✅ Home page shows "continue workout" button for active workouts
4. ✅ Warns before starting a new workout if one is active
5. ✅ Each workout has its own unique URL that can be bookmarked

## Technical Details

### Workout ID Format
- Format: `{timestamp}-{random-string}`
- Example: `1731234567890-abc123xyz`
- Ensures uniqueness and rough chronological ordering

### Local Storage Keys
- `currentWorkoutId`: The ID of the active workout
- `workoutState`: The full state of the active workout (includes workoutId)
- `workoutExercises`: Exercises for the workout (cleared after load)
- `workoutWarmupMinutes`: Warmup duration setting

### URL Structure
- `/workout/[id]`: Dynamic route for workout sessions
- Each workout gets a unique URL based on its ID
- URL can be shared or bookmarked to return to the workout

## Testing Scenarios

1. **Start workout → Close tab → Reopen with URL**
   - Expected: Workout resumes exactly where you left off

2. **Start workout → Navigate to home → Click "continue workout"**
   - Expected: Returns to active workout with all data intact

3. **Active workout exists → Click "new workout"**
   - Expected: Confirmation dialog, then clears old workout if confirmed

4. **Open old workout URL without localStorage data**
   - Expected: Redirects to home page

5. **Finish workout → Navigate to home**
   - Expected: No "continue workout" button (localStorage cleared)

## Future Enhancements

Possible improvements:
- Store workout history in database with these IDs
- Allow browsing past workouts by URL
- Share workout URLs with others
- Add workout templates with shareable URLs

