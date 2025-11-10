# Testing Guide: Workout URL & Local Storage Improvements

## Quick Test Scenarios

### 1. Basic Flow - Unique URL Generation
**Steps:**
1. Open the app at `http://localhost:3000`
2. Click "new workout"
3. Select any workout set and click "start"
4. **Check the URL** - it should now be something like:
   ```
   http://localhost:3000/workout/1731234567890-abc123xyz
   ```
   (Not `/workout/1` anymore!)

**Expected Result:** ✅ URL contains unique ID with timestamp and random string

---

### 2. Resume After Closing Tab
**Steps:**
1. Start a workout (as above)
2. Complete at least the warmup stage
3. **Copy the URL** from the browser address bar
4. Close the browser tab completely
5. Open a new tab and paste the URL
6. Press Enter

**Expected Result:** ✅ Workout resumes exactly where you left off

---

### 3. Continue Workout from Home
**Steps:**
1. Start a workout
2. Complete warmup stage
3. Navigate back to home page (click X or go to `/`)
4. **Look for "continue workout" button** (should be red/orange)
5. Click "continue workout"

**Expected Result:** ✅ Returns to active workout with all progress intact

---

### 4. New Workout with Active Session
**Steps:**
1. Start a workout and complete warmup
2. Navigate to home page
3. Notice both "continue workout" (red) and "new workout" (black) buttons
4. Click "new workout"
5. Confirm the dialog

**Expected Result:** 
- ✅ Shows confirmation dialog
- ✅ After confirming, old workout is discarded
- ✅ Can start fresh new workout

---

### 5. Invalid/Old URL Protection
**Steps:**
1. Start a workout and note the URL
2. Finish the workout completely
3. Try to navigate back to the old workout URL (from step 1)

**Expected Result:** ✅ Redirects to home page (no data for that workout)

---

### 6. Multiple Tab Protection
**Steps:**
1. Start a workout in Tab A
2. Open the app in Tab B at home page
3. Tab B should show "continue workout" button
4. Click it in Tab B

**Expected Result:** ✅ Tab B opens the same workout URL and resumes progress

---

## Visual Checks

### Home Page
When **no active workout:**
```
┌─────────────────────┐
│   new workout       │  ← Single black button
└─────────────────────┘
```

When **active workout exists:**
```
┌─────────────────────┐
│  continue workout   │  ← Red button (primary action)
└─────────────────────┘
┌─────────────────────┐
│   new workout       │  ← Black button (secondary)
└─────────────────────┘
```

---

## Local Storage Inspection

Open Developer Tools → Application → Local Storage → `http://localhost:3000`

**During active workout:**
```javascript
{
  "currentWorkoutId": "1731234567890-abc123xyz",
  "workoutState": "{...}", // Full workout state
  "workoutExercises": "[...]" // Exercise data
}
```

**After workout is finished/cancelled:**
```javascript
{
  // currentWorkoutId - REMOVED ✓
  // workoutState - REMOVED ✓
}
```

---

## Common Issues & Solutions

### Issue: URL still shows `/workout/1`
**Solution:** Clear localStorage and restart:
```javascript
localStorage.clear()
```
Then start a new workout.

### Issue: "continue workout" button doesn't appear
**Solution:** Check that:
1. Workout stage is not "finished"
2. Both `currentWorkoutId` and `workoutState` exist in localStorage
3. Try refreshing the page

### Issue: Workout doesn't resume after reopening URL
**Solution:** 
1. Check if localStorage was cleared by browser
2. Verify the URL ID matches `currentWorkoutId` in localStorage
3. Check browser console for error messages

---

## Success Criteria

All improvements are working if:

- ✅ Each workout gets a unique, meaningful URL
- ✅ URL persists across tab closures
- ✅ Can bookmark and return to active workout
- ✅ Home page shows active workout status
- ✅ Old workout data is cleaned up properly
- ✅ No conflicts between multiple sessions
- ✅ Protection against invalid URLs

---

## Notes

- Workout IDs are **client-side only** (not stored in database yet)
- IDs are unique per browser/device
- Clearing localStorage will break URL-to-workout connection
- Consider adding server-side session storage in future

