# Environment Setup Instructions

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Google Gemini API Key for AI Workout Generation
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Your existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated API key
5. Paste it into your `.env.local` file

## After Adding Variables

1. Restart your development server:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   pnpm dev
   ```

2. Test the AI workout generation:
   - Go to `/start` page
   - Click "✨ ai suggested" tab
   - Enter your workout goals
   - Click "generate workout"

## Troubleshooting

If you see "NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set":
1. Make sure you added it to `.env.local` (not `.env`)
2. Make sure there are no spaces around the `=` sign
3. Restart the development server
4. Check that the file is in the root directory of the project

## Free Tier Limits

Google Gemini free tier includes:
- 15 requests per minute
- 1,500 requests per day
- 1,000,000 tokens per minute

This is more than enough for personal use and testing.

