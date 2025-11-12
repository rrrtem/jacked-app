# Troubleshooting AI Workout Generation

## Error: "Failed to generate workout"

This error can have several causes. Follow these steps:

### 1. Restart Dev Server

**IMPORTANT:** Environment variables are loaded when the server starts.

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
pnpm dev
```

### 2. Check Console Logs

Open browser console (F12) and look for:
- ✅ "Gemini API key is set" - Good!
- ❌ "GEMINI_API_KEY is not set" - Restart server
- 🔄 "Calling Gemini API..." - Request started
- 📡 "Gemini API response status: XXX" - Check status code

### 3. Check Server Terminal Logs

Look for errors in the terminal where you run `pnpm dev`:
- API errors will show here
- Look for error messages with ❌ emoji

### 4. Common Issues & Solutions

#### Issue: "NEXT_PUBLIC_GEMINI_API_KEY is not set"
**Solution:** 
1. Check `.env.local` file exists in project root
2. Check it contains: `NEXT_PUBLIC_GEMINI_API_KEY=your_key`
3. **Restart dev server** (very important!)

#### Issue: "Gemini API key is invalid" (403 error)
**Solution:**
1. Go to https://makersuite.google.com/app/apikey
2. Delete old key
3. Create new API key
4. Update `.env.local` with new key
5. Restart dev server

#### Issue: "Rate limit exceeded" (429 error)
**Solution:**
- Wait 1 minute
- Try again
- Free tier limit: 15 requests/minute

#### Issue: "No response from Gemini"
**Solution:**
- Gemini may have blocked the request due to safety filters
- Try simpler context input
- Try again (it's usually temporary)

#### Issue: "Invalid JSON response from LLM"
**Solution:**
- This is rare - Gemini failed to return proper JSON
- Just try again
- Check logs for the actual response

### 5. Test API Key Manually

Test your API key directly:

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

Should return JSON with "Hello" message.

### 6. Check Logs After Fix

After restarting server, you should see in browser console:
```
✅ Gemini API key is set
🔄 Calling Gemini API...
📡 Gemini API response status: 200
✅ Gemini response received, length: XXX
✅ Successfully parsed JSON response
✅ AI workout generated: { exercises: X, reasoning: "..." }
```

### 7. Still Not Working?

1. **Check network connection**
   - Can you access google.com?
   - Any firewall/proxy blocking requests?

2. **Check Gemini API status**
   - Visit https://status.cloud.google.com/

3. **Try with empty context**
   - Leave "goals for today" field empty
   - Click Generate
   - Simpler prompt = less likely to fail

4. **Check database**
   - Make sure you have exercises in database
   - Run: `SELECT COUNT(*) FROM exercises;` in Supabase

### 8. Enable Debug Mode

To see full request/response, add this to browser console:

```javascript
localStorage.setItem('debug', 'true')
```

Then try generating again. Full logs will appear.

## Quick Checklist

- [ ] `.env.local` file exists
- [ ] `NEXT_PUBLIC_GEMINI_API_KEY=...` is in the file
- [ ] Dev server was restarted after adding key
- [ ] Browser console shows "✅ Gemini API key is set"
- [ ] You have exercises in database
- [ ] Internet connection works
- [ ] No firewall blocking Google APIs

## Get Help

If none of this works:
1. Copy full error from browser console
2. Copy full error from server terminal
3. Check if other API features work (if any)
4. Try creating a new Gemini API key

