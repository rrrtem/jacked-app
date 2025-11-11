# Workout Session Module

This directory contains all code related to the active workout session. Everything is self-contained within this folder for easier navigation and maintenance.

## 📁 File Structure

### Core Files
- **`page.tsx`** - Main workout session component (orchestrates all stages)
- **`types.ts`** - TypeScript type definitions
- **`utils.ts`** - Utility helper functions
- **`database.ts`** - Database operations (Supabase queries)

### Custom Hooks
- **`useWakeLock.ts`** - Prevents screen from sleeping during workout (uses Screen Wake Lock API)
- **`useBackgroundTimer.ts`** - Background-resilient timer implementation (currently not used, but available)

### UI Components (Stages)
- **`WarmupStage.tsx`** - Initial warmup phase
- **`ExerciseStage.tsx`** - Exercise execution (warmup + working sets)
- **`RestStage.tsx`** - Rest period between sets
- **`AddExerciseStage.tsx`** - Add new exercise mid-workout
- **`FinishedStage.tsx`** - Workout completion summary

### Supporting Components
- **`WorkoutHeader.tsx`** - Top navigation bar with timer
- **`ExerciseControls.tsx`** - Input controls for weight/reps/duration

## 🔑 Key Features

### 1. Screen Wake Lock
The app uses the **Screen Wake Lock API** to prevent the screen from sleeping during workout:
- Automatically activates when workout is active
- Re-acquires lock when returning to app from background
- Supported in modern browsers including Safari on iOS 16.4+

### 2. State Persistence
All workout state is saved to `localStorage`:
- Survives page refreshes
- Tracks workout progress
- Validates workout ID matches URL

### 3. Exercise Type Support
- **Weight-based**: weight (kg) + reps
- **Duration-based**: duration (seconds) only
- **Bodyweight**: reps only

### 4. AI Suggestions
Uses progression system to suggest weights/reps based on:
- Previous personal records
- Set number in current session
- Exercise type

## 🏗️ Architecture

```
page.tsx (Main Orchestrator)
  ├─ WarmupStage
  │   └─ WorkoutHeader
  ├─ ExerciseStage
  │   ├─ WorkoutHeader
  │   └─ ExerciseControls
  ├─ RestStage
  ├─ AddExerciseStage
  │   └─ ExerciseSelector (from /components)
  └─ FinishedStage
```

### State Flow
1. Load exercises from localStorage
2. Enrich with data from Supabase
3. User progresses through stages
4. Save completed sets
5. Save to database on finish
6. Calculate and update records

## 🚀 Usage

The workout session is automatically started when user navigates to `/workout/[id]`.

### Required localStorage items:
- `workoutExercises` - Array of exercises for this session
- `workoutWarmupMinutes` - Warmup duration in minutes
- `currentWorkoutId` - Current workout session ID

### Stage Transitions:
```
warmup 
  → exercise-warmup 
  → working-set 
  → rest 
  → (repeat) 
  → add-exercise-prompt 
  → finished
```

## 🔧 Maintenance

When modifying:
1. Keep all workout-related code in this directory
2. Update types in `types.ts` first
3. Add database queries to `database.ts`
4. Create new stage components for major UI changes
5. Test state persistence after changes

## 📱 Mobile Considerations

- Uses `visualViewport` API for keyboard handling
- Implements smooth scrolling for input focus
- Backdrop blur for bottom controls
- Touch-optimized button sizes (64px minimum)

## 🐛 Known Limitations

- Wake Lock API not supported in older browsers (gracefully degrades)
- Timer may drift slightly if device is heavily loaded
- Background timer hook (`useBackgroundTimer`) is prepared but not currently used

