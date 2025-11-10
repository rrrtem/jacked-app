# Settings Page Implementation

## Overview

Implemented a comprehensive settings page at `/settings` that allows users to configure their workout preferences, progression logic, and manage their account.

## Features

### 1. Profile Settings
- **Name**: Editable user name field
- **Email**: Display-only email field (cannot be changed for security)

### 2. Progression Logic
- **8 Available Configurations**:
  - Standard Linear
  - Aggressive Linear
  - Conservative Linear
  - Light Weight Linear
  - Standard Percentage
  - High Volume
  - Beginner Friendly
  - Advanced

- **Impact**: Selected progression logic affects AI suggested workout inputs and set/rep recommendations
- **Visual Selection**: Cards with descriptions for easy selection

### 3. Training Preferences
- **Free Text Field**: Large textarea for users to describe their training approach
- **Purpose**: Used by AI system to personalize workout suggestions
- **Example**: "I focus on strength training with heavy compound movements. I prefer 3-4 workouts per week with 1-2 rest days in between..."

### 4. Account Management
- **Logout Button**: Red logout button with icon
- **Clears all local storage** on logout

## Database Changes

### Migration: `migration_user_preferences.sql`

Added two new columns to the `users` table:

```sql
progression_config TEXT DEFAULT 'standard-linear'
training_preferences TEXT DEFAULT NULL
```

### Updated Types

Updated `lib/types/database.ts` to include:
- `progression_config: string | null`
- `training_preferences: string | null`

## UI/UX Design

### Consistent Design System
- Follows the minimalist design of the rest of the app
- Black and white color scheme with red accents
- Large, readable fonts (32px headers, 20px content)
- Rounded buttons and inputs (12px border radius)
- Smooth transitions and hover states

### Layout
- Clean sections with visual separation
- Sticky "Save Changes" button at bottom with blur overlay
- Success/Error message notifications
- Loading states for async operations

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Clear visual feedback for selections
- Disabled state for non-editable fields

## Navigation

### Access Points
1. **Main Dashboard**: Settings icon in top-right corner (gear icon)
2. **Direct URL**: `/settings`

### Close Actions
- X button in top-right returns to home
- Back button/gesture works as expected

## Implementation Details

### File Structure
```
app/settings/
  └── page.tsx              # Settings page component

db/
  └── migration_user_preferences.sql   # Database migration

lib/types/
  └── database.ts           # Updated TypeScript types
```

### State Management
- Local React state for form values
- Optimistic UI updates
- Auto-saves to Supabase on "Save Changes" click
- Success feedback with auto-dismiss (2 seconds)

### Data Flow
1. Load user settings from Supabase on mount
2. User modifies settings in UI
3. Click "Save Changes" triggers upsert to database
4. Success message shown briefly
5. Settings persist across sessions

## Security

- Row Level Security (RLS) enforced on `users` table
- Users can only read/write their own settings
- Email field is read-only in UI
- Session validation before all operations
- Redirects to login if no valid session

## Future Enhancements

Potential additions:
- [ ] Avatar upload functionality
- [ ] Password change (if not using OAuth)
- [ ] Notification preferences
- [ ] Units preference (kg/lbs)
- [ ] Rest day preferences for AI
- [ ] Workout duration preferences
- [ ] Export workout data
- [ ] Delete account option

## Testing Checklist

- [ ] Settings load correctly for authenticated user
- [ ] Name changes save properly
- [ ] Email is displayed but not editable
- [ ] Progression config selection works
- [ ] Training preferences textarea saves
- [ ] Logout clears session and redirects
- [ ] Success message appears after save
- [ ] Error handling works for network issues
- [ ] Loading states display correctly
- [ ] Mobile responsive design works
- [ ] Back navigation works properly

## Integration with AI System

The settings configured here are used by:
1. **AI Suggested Workouts** (`lib/ai-suggest/`):
   - Uses `progression_config` to determine set/rep schemes
   - Uses `training_preferences` for exercise selection and workout structure

2. **Workout Input Suggestions** (`app/workout/[id]/page.tsx`):
   - Applies selected progression logic to weight/rep suggestions
   - Considers user preferences for rest times and intensity

## Related Files

- `lib/progression/configs.ts` - Progression configuration definitions
- `lib/ai-suggest/generator.ts` - AI workout generation logic
- `app/page.tsx` - Main dashboard with settings link
- `db/DATABASE_SCHEMA.md` - Updated schema documentation


