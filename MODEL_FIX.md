# Model Name Fix

## Issue
The initial implementation used `gemini-1.5-flash` which resulted in a 404 error:
```
models/gemini-1.5-flash is not found for API version v1beta
```

## Solution
Changed to `gemini-1.5-flash-latest` which is the correct model name for the Gemini API v1beta.

## Valid Gemini Model Names

### Free Tier Models
- ✅ `gemini-1.5-flash-latest` - Fast, efficient, recommended for most use cases
- ✅ `gemini-1.5-flash` - Stable version
- ✅ `gemini-1.5-pro-latest` - More powerful, slower, higher quality
- ✅ `gemini-1.5-pro` - Stable version

### How to Change Model

Edit `lib/ai-suggest/llm-providers.ts`:

```typescript
constructor(config: LLMProviderConfig) {
  this.apiKey = config.apiKey
  this.model = config.model || 'gemini-1.5-flash-latest' // Change here
}
```

Or pass it when creating client:

```typescript
const client = createLLMClient('google-gemini', { 
  apiKey: 'your-key',
  model: 'gemini-1.5-pro-latest' // For higher quality
})
```

## Model Comparison

| Model | Speed | Quality | Cost (Free Tier) | Recommended For |
|-------|-------|---------|------------------|-----------------|
| gemini-1.5-flash-latest | Fast | Good | Free | General use, fast responses |
| gemini-1.5-pro-latest | Slower | Better | Free | Complex reasoning, detailed explanations |

## Reference
- Gemini API Models: https://ai.google.dev/models/gemini
- API Documentation: https://ai.google.dev/api/rest/v1beta/models

