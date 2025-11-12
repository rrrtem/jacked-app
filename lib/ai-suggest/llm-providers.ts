/**
 * LLM Provider System
 * Supports multiple LLM providers with easy switching
 */

export type LLMProvider = 'google-gemini' | 'openai' | 'anthropic'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface LLMProviderConfig {
  apiKey: string
  model?: string
}

/**
 * Abstract LLM Client Interface
 */
export interface LLMClient {
  generateStructured<T = unknown>(
    messages: LLMMessage[],
    schema?: Record<string, unknown>
  ): Promise<T>
}

/**
 * Google Gemini Client
 */
class GoogleGeminiClient implements LLMClient {
  private apiKey: string
  private model: string

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey
    // Use the correct model name for Gemini API (without version number)
    this.model = config.model || 'gemini-flash-latest'
  }

  async generateStructured<T = unknown>(
    messages: LLMMessage[],
    schema?: Record<string, unknown>
  ): Promise<T> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`

    // Convert messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system') // Gemini doesn't support system messages directly
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

    // Add system message to first user message if present
    const systemMessage = messages.find(m => m.role === 'system')
    if (systemMessage && contents.length > 0) {
      const firstContent = contents[0]
      if (firstContent.role === 'user') {
        firstContent.parts[0].text = `${systemMessage.content}\n\n${firstContent.parts[0].text}`
      }
    }

    // Build generation config without responseMimeType (it truncates responses)
    const requestBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, // Increased for longer responses
      }
    }

    // Note: Not using responseMimeType/responseSchema as they can truncate responses
    // Instead, we explicitly request JSON format in the prompt

    try {
      console.log('🔄 Calling Gemini API...')
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📡 Gemini API response status:', response.status)

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ Gemini API error response:', error)
        
        // More specific error messages
        if (response.status === 400) {
          throw new Error(`Invalid request to Gemini API. Check your API key or request format.`)
        } else if (response.status === 403) {
          throw new Error(`Gemini API key is invalid or doesn't have permission. Get a new key from: https://makersuite.google.com/app/apikey`)
        } else if (response.status === 429) {
          throw new Error(`Gemini API rate limit exceeded. Please wait a moment and try again.`)
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('❌ No candidates in Gemini response:', data)
        throw new Error('No response from Gemini. The model may have blocked the request.')
      }

      let content = data.candidates[0].content.parts[0].text
      console.log('✅ Gemini response received, length:', content.length)
      
      // Clean up response: remove markdown code blocks if present
      content = content.trim()
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '')
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/```\s*$/, '')
      }
      
      console.log('Cleaned content length:', content.length)
      
      // Parse JSON response
      try {
        const parsed = JSON.parse(content) as T
        console.log('✅ Successfully parsed JSON response')
        return parsed
      } catch (parseError) {
        console.error('❌ Failed to parse Gemini response:', content)
        console.error('Parse error:', parseError)
        throw new Error('Invalid JSON response from LLM. Please try again.')
      }
    } catch (error) {
      console.error('❌ Gemini API error:', error)
      throw error
    }
  }
}

/**
 * OpenAI Client (placeholder for future implementation)
 */
class OpenAIClient implements LLMClient {
  private apiKey: string
  private model: string

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'gpt-4'
  }

  async generateStructured<T = unknown>(
    _messages: LLMMessage[],
    _schema?: Record<string, unknown>
  ): Promise<T> {
    throw new Error('OpenAI provider not implemented yet')
  }
}

/**
 * Factory function to create LLM client
 */
export function createLLMClient(
  provider: LLMProvider,
  config: LLMProviderConfig
): LLMClient {
  switch (provider) {
    case 'google-gemini':
      return new GoogleGeminiClient(config)
    case 'openai':
      return new OpenAIClient(config)
    case 'anthropic':
      throw new Error('Anthropic provider not implemented yet')
    default:
      throw new Error(`Unknown LLM provider: ${provider}`)
  }
}

/**
 * Get default LLM client (Google Gemini with free tier)
 */
export function getDefaultLLMClient(): LLMClient {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('❌ NEXT_PUBLIC_GEMINI_API_KEY is not set!')
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')))
    throw new Error(
      'NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set. ' +
      'Please add it to your .env.local file and restart the dev server. ' +
      'Get your API key from: https://makersuite.google.com/app/apikey'
    )
  }

  console.log('✅ Gemini API key is set')
  return createLLMClient('google-gemini', { apiKey })
}

