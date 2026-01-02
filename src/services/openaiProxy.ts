/**
 * OpenAI Proxy Service
 * 
 * Calls OpenAI through our secure Vercel serverless function.
 * The API key is stored on the server and never exposed to the browser.
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProxy {
  private static readonly API_ENDPOINT = '/api/openai';

  /**
   * Send a chat completion request through the secure proxy
   */
  static async chatCompletion(
    messages: ChatMessage[],
    options?: {
      model?: string;
      max_tokens?: number;
    }
  ): Promise<string> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: options?.model || 'gpt-4o-mini',
          max_tokens: options?.max_tokens || 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data: OpenAIResponse = await response.json();
      return data.content;
    } catch (error) {
      console.error('OpenAI Proxy error:', error);
      throw error;
    }
  }

  /**
   * Helper for simple prompts
   */
  static async prompt(userMessage: string, systemMessage?: string): Promise<string> {
    const messages: ChatMessage[] = [];
    
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    
    messages.push({ role: 'user', content: userMessage });
    
    return this.chatCompletion(messages);
  }
}

