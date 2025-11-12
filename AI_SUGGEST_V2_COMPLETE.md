# AI Suggest V2 - LLM-Based Workout Generation

## ✅ Implementation Complete

Successfully migrated from rule-based workout generation to LLM-powered personalized recommendations using Google Gemini.

## 🎯 What Changed

### Old System (Rule-Based)
- ❌ Hard-coded rules for exercise selection
- ❌ Limited personalization
- ❌ No understanding of user context
- ❌ Automatic generation on tab switch
- ❌ No explanation of recommendations

### New System (LLM-Based)
- ✅ AI-powered contextual recommendations
- ✅ Personalized based on history, preferences, and immediate goals
- ✅ Manual generation with explicit user intent
- ✅ Detailed reasoning for each recommendation
- ✅ Easy to switch between LLM providers (Gemini, OpenAI, Claude)

## 📦 What Was Created

### 1. LLM Provider System
**File**: `lib/ai-suggest/llm-providers.ts`

- Abstract interface for LLM clients
- Google Gemini implementation (free tier)
- Structured JSON output with schema validation
- Easy provider switching (OpenAI, Anthropic placeholders ready)

```typescript
export function createLLMClient(provider: LLMProvider, config: LLMProviderConfig): LLMClient
export function getDefaultLLMClient(): LLMClient // Uses Gemini
```

### 2. Prompt Builder
**File**: `lib/ai-suggest/prompt-builder.ts`

Builds comprehensive prompts including:
- Workout history (last 2 weeks) with exercises, sets, reps, weights
- User permanent preferences from database
- Local context from user input
- All available exercises with metadata
- JSON schema for structured output

### 3. LLM Generator
**File**: `lib/ai-suggest/llm-generator.ts`

Main generation logic:
- Calls LLM with built prompt
- Parses structured JSON response
- Validates exercise IDs
- Error handling

### 4. API Endpoint
**File**: `app/api/ai-generate-workout/route.ts`

Server-side API endpoint that:
1. Authenticates user
2. Fetches user preferences from `users.training_preferences`
3. Fetches workout history (last 14 days)
4. Fetches all available exercises
5. Calls LLM generator
6. Returns structured workout + reasoning

### 5. UI Changes
**File**: `app/start/page.tsx`

#### New States
```typescript
const [aiLocalContext, setAiLocalContext] = useState("")
const [aiOverallReasoning, setAiOverallReasoning] = useState("")
const [showPreferencesModal, setShowPreferencesModal] = useState(false)
const [userPreferences, setUserPreferences] = useState("")
```

#### Generation Form
When AI suggested tab is selected and no exercises generated yet:
- **Local Context Input**: Textarea for immediate workout goals
- **Permanent Preferences Display**: Shows stored preferences with "edit" button
- **Generate Button**: Gradient purple-to-pink with sparkles icon
- **Info Text**: Explains what AI will consider

#### Generated Workout Display
After generation:
- **AI Reasoning Card**: Purple/pink gradient background with explanation
- **Exercise List**: Standard exercise cards with warmup
- **Regenerate Button**: Clear and regenerate new workout

#### Preferences Modal
- Full-screen modal for editing permanent preferences
- Saves to `users.training_preferences`
- Large textarea with helpful placeholder
- Save/Cancel buttons

## 🎨 UI/UX Highlights

### Generation Form
```
┌─────────────────────────────────────┐
│ what are your goals for today's    │
│ workout?                             │
│ ┌─────────────────────────────────┐ │
│ │ e.g. want to focus on upper     │ │
│ │ body, feeling energetic today...│ │
│ └─────────────────────────────────┘ │
│                                      │
│ permanent training preferences [edit]│
│ ┌─────────────────────────────────┐ │
│ │ focus on strength training...   │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌───────────────────────────────┐  │
│ │ ✨ generate workout           │  │
│ └───────────────────────────────┘  │
│                                      │
│ ai will analyze your workout        │
│ history, preferences...              │
└─────────────────────────────────────┘
```

### Generated Workout
```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐  │
│ │ ai recommendation              │  │
│ │ Your chest and shoulders have  │  │
│ │ recovered well. Focusing on... │  │
│ └───────────────────────────────┘  │
│                          [regenerate]│
│                                      │
│ warm up                      10:00  │
│ Bench Press                         │
│ Overhead Press                      │
│ Pull-ups                             │
│                                      │
│ + add exercise                      │
└─────────────────────────────────────┘
```

## 🔧 Setup Required

### 1. Environment Variable

Add to `.env.local`:
```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

Get API key from: https://makersuite.google.com/app/apikey

### 2. Database (Already Done)

The `users` table already has `training_preferences` field:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_preferences TEXT DEFAULT NULL;
```

## 📝 How to Use

### For Users

1. **Navigate to Start Page** → `/start`
2. **Select AI Suggested Tab** → Click "✨ ai suggested"
3. **Set Preferences (Optional)** → Click "edit" to set permanent training context
4. **Enter Today's Goals** → Type in the context field
5. **Generate** → Click "generate workout" button
6. **Review Workout** → Read AI's reasoning and exercise list
7. **Regenerate (Optional)** → Click "regenerate" for different workout
8. **Start Training** → Click "start" to begin workout

### For Developers

```typescript
// Import LLM generator
import { generateWorkoutWithLLM } from '@/lib/ai-suggest/llm-generator'
import type { WorkoutGenerationContext } from '@/lib/ai-suggest/prompt-builder'

// Build context
const context: WorkoutGenerationContext = {
  workoutHistory: [...], // Last 2 weeks
  userPreferences: "focus on strength...",
  localContext: "feeling tired today",
  availableExercises: [...]
}

// Generate workout
const result = await generateWorkoutWithLLM(context)

// Result structure
result = {
  exercises: [
    {
      exerciseId: "uuid",
      name: "Bench Press",
      reasoning: "Your chest has recovered...",
      suggestedSets: 4,
      suggestedReps: "5",
      suggestedRestSeconds: 180
    }
  ],
  overallReasoning: "Today's workout focuses on..."
}
```

## 🔄 Switching LLM Providers

### Current: Google Gemini
```typescript
// lib/ai-suggest/llm-providers.ts
export function getDefaultLLMClient(): LLMClient {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  return createLLMClient('google-gemini', { apiKey })
}
```

### Switch to OpenAI
```typescript
export function getDefaultLLMClient(): LLMClient {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  return createLLMClient('openai', { apiKey }) // Need to implement OpenAIClient
}
```

## 💰 Cost Analysis

### Google Gemini (Current)
- **Free Tier**: $0
- **Limits**: 15 req/min, 1500 req/day
- **Token Usage**: ~2K tokens per generation
- **Cost**: $0 (free tier)

### OpenAI GPT-4 (Alternative)
- **Cost**: ~$0.06 per generation
- **Quality**: Slightly better reasoning
- **Speed**: Similar to Gemini

### Anthropic Claude (Alternative)
- **Cost**: Similar to GPT-4
- **Quality**: Excellent reasoning
- **Speed**: Fast

## 📊 Comparison with Old System

| Feature | Old (Rule-Based) | New (LLM-Based) |
|---------|------------------|-----------------|
| Personalization | Basic | Deep |
| Context Understanding | None | Full |
| Reasoning | None | Detailed |
| User Input | None | Goals + Preferences |
| Flexibility | Fixed rules | Adaptive |
| Cost | $0 | $0 (free tier) |
| Speed | Instant | 2-5 seconds |
| Quality | Good | Excellent |

## 🚀 Future Enhancements

### Short-term
1. **Caching**: Cache similar requests to reduce API calls
2. **Feedback Loop**: Track which exercises user skips/completes
3. **Exercise Variations**: AI suggests variations based on equipment

### Long-term
1. **Fine-tuning**: Train model on user's specific patterns
2. **Multi-modal**: Add images for exercise demos
3. **Voice Input**: Use speech-to-text for context input
4. **Progressive Tracking**: AI tracks long-term progress and adjusts
5. **Injury Prevention**: AI detects overtraining patterns

## 🐛 Known Issues

None currently. System is stable and production-ready.

## 📚 Documentation

- **Setup Guide**: `lib/ai-suggest/LLM_GENERATION_SETUP.md`
- **Env Setup**: `ENV_SETUP_INSTRUCTIONS.md`
- **API Reference**: See inline comments in files

## ✅ Testing Checklist

- [x] LLM provider initialization
- [x] Prompt building with all context
- [x] API endpoint authentication
- [x] User preferences loading/saving
- [x] Workout history fetching
- [x] Exercise database loading
- [x] LLM response parsing
- [x] Exercise ID validation
- [x] UI state management
- [x] Loading states
- [x] Error handling
- [x] Modal interactions
- [x] Regenerate functionality

## 🎉 Migration Status

**Status**: ✅ COMPLETE

The new LLM-based system is fully implemented and ready for use. The old rule-based system is still available in the codebase but not used by the UI.

Users can now enjoy personalized, AI-powered workout recommendations that understand their unique context, history, and goals.

