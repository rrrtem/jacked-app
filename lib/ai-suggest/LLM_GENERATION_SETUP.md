# LLM-Based Workout Generation Setup

## Overview

The new AI-powered workout generation system uses Google Gemini (free tier) to create personalized workout recommendations based on:

1. **Workout History** (last 2 weeks)
2. **User Permanent Preferences** (stored in database)
3. **Local Context** (user's immediate goals/feelings)
4. **Available Exercises** (from database)

## Setup Instructions

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key or use an existing one
5. Copy the API key

### 2. Add Environment Variable

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

**Note:** The `NEXT_PUBLIC_` prefix makes it available in the browser, which is needed for client-side API calls.

### 3. Test the Integration

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `/start` page
3. Click on the "✨ ai suggested" tab
4. You should see:
   - Input field for today's workout goals
   - Section showing permanent preferences (with edit button)
   - "Generate workout" button

5. (Optional) Click "edit" to set your permanent training preferences
6. Enter your current context (e.g., "want to focus on upper body")
7. Click "generate workout"
8. Wait for AI to generate personalized workout

## Architecture

### Files Structure

```
lib/ai-suggest/
├── llm-providers.ts        # LLM provider abstraction (Google Gemini, OpenAI, etc.)
├── prompt-builder.ts       # Builds prompts with all context
├── llm-generator.ts        # Main generation logic
└── LLM_GENERATION_SETUP.md # This file

app/api/
└── ai-generate-workout/
    └── route.ts           # API endpoint for generation
```

### How It Works

1. **User Input**: User enters local context and clicks "Generate"
2. **API Call**: Frontend calls `/api/ai-generate-workout` with local context
3. **Context Gathering**: Server gathers:
   - User preferences from `users.training_preferences`
   - Workout history from last 14 days
   - All available exercises
4. **Prompt Building**: System builds structured prompt with all context
5. **LLM Call**: Sends prompt to Google Gemini with JSON schema
6. **Response Parsing**: Parses structured JSON response
7. **Validation**: Validates that exercise IDs exist in database
8. **UI Update**: Shows generated exercises + AI reasoning

### Response Format

The LLM returns a structured JSON:

```json
{
  "exercises": [
    {
      "exerciseId": "uuid-from-db",
      "name": "Exercise Name",
      "reasoning": "Why this exercise is recommended",
      "suggestedSets": 3,
      "suggestedReps": "8-10",
      "suggestedRestSeconds": 120
    }
  ],
  "overallReasoning": "Overall explanation of the workout plan"
}
```

## Switching LLM Providers

The system is designed to easily switch between providers:

### Current: Google Gemini (Free Tier)

- **Model**: `gemini-1.5-flash-latest`
- **Pricing**: Free tier with rate limits
- **Pros**: Fast, free, good quality
- **Cons**: Rate limits, Google account required
- **Alternative**: Use `gemini-1.5-pro-latest` for higher quality (slower)

### Future: OpenAI (Paid)

To switch to OpenAI:

1. Update environment variable:
   ```bash
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
   ```

2. Modify `llm-providers.ts`:
   ```typescript
   // In getDefaultLLMClient()
   const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
   return createLLMClient('openai', { apiKey })
   ```

3. Implement OpenAI client (currently placeholder)

### Future: Anthropic Claude

To switch to Anthropic:

1. Update environment variable:
   ```bash
   NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
   ```

2. Modify `llm-providers.ts` similar to OpenAI

## Database Schema

### User Preferences Field

The `users` table already has a `training_preferences` field:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_preferences TEXT DEFAULT NULL;
```

This field stores the user's permanent training context that the AI should always consider.

## Prompt Engineering

The system uses a carefully crafted prompt that includes:

1. **System Message**: Defines AI role as expert trainer
2. **User History**: Last 2 weeks of workouts with exercises, sets, reps, weights
3. **User Preferences**: Permanent training goals, limitations, preferences
4. **Local Context**: Immediate goals for this session
5. **Available Exercises**: Full list with metadata

The prompt emphasizes:
- Progressive overload
- Recovery time for muscle groups
- Balanced development
- Variety in exercise selection
- Personalization based on context

## Troubleshooting

### "NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set"

Make sure you added the API key to `.env.local` and restarted the dev server.

### "Failed to generate workout"

Check the browser console and server logs for detailed error messages. Common issues:
- Invalid API key
- Rate limit exceeded (wait a few minutes)
- Network issues

### Generated exercises don't appear

Check that:
1. Exercises exist in the database
2. Exercise IDs in response match database IDs
3. Browser console for validation errors

## Rate Limits

Google Gemini Free Tier:
- **Requests per minute**: 15
- **Requests per day**: 1500
- **Tokens per minute**: 1,000,000

For production, consider:
- Implementing request caching
- Adding rate limiting on your API
- Upgrading to paid tier if needed

## Cost Estimation

### Google Gemini (Current)
- **Free Tier**: $0
- **Paid Tier**: ~$0.000125 per 1K tokens

Typical workout generation uses ~2K tokens = $0.00025 per generation

### OpenAI (Alternative)
- **GPT-4**: ~$0.03 per 1K input tokens
- Typical generation cost: ~$0.06 per workout

### Anthropic Claude (Alternative)
- **Claude 3**: Similar to GPT-4 pricing

## Future Improvements

1. **Caching**: Cache generations for same context
2. **Fine-tuning**: Fine-tune model on user's workout patterns
3. **Feedback Loop**: Learn from which exercises user skips/completes
4. **Multi-modal**: Add image generation for exercise demonstrations
5. **Voice Input**: Use voice for local context input
6. **Progressive Enhancement**: Fall back to rule-based system if LLM fails

## Security Notes

⚠️ **Important**: The API key is exposed in the browser (NEXT_PUBLIC_*). This is acceptable for:
- Development environment
- Services with rate limiting
- Free tier usage

For production with paid tier:
1. Move API calls to server-side only
2. Remove `NEXT_PUBLIC_` prefix
3. Call LLM from API route, not from browser
4. Add authentication and rate limiting

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs (terminal)
3. Verify API key is valid
4. Test API key directly with curl:

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

