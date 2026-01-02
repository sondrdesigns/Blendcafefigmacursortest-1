import { OpenAIProxy } from './openaiProxy';

// Available categories in the app
const AVAILABLE_CATEGORIES = [
  'Coffee',
  'Studying',
  'Dates',
  'Vibes',
  'WiFi',
  'Working',
  'Quiet',
  'Groups',
  'Outdoor',
  'Pastries'
];

export class AiCategorizationService {
  private static cache: Map<string, string[]> = new Map();

  /**
   * Analyze reviews and determine appropriate categories using AI
   */
  static async categorizeCafe(
    cafeName: string,
    reviews: string[],
    rating: number,
    priceLevel: number
  ): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `${cafeName}-${reviews.join('').substring(0, 50)}`;
      if (this.cache.has(cacheKey)) {
        console.log(`✅ Using cached categories for ${cafeName}`);
        return this.cache.get(cacheKey)!;
      }

      console.log(`🤖 AI analyzing ${cafeName}...`);

      // Prepare review summary
      const reviewText = reviews.slice(0, 5).join('\n\n'); // Use first 5 reviews

      // Create prompt for GPT
      const userPrompt = `
You are a cafe categorization expert. Analyze the following cafe and determine which categories it's best suited for.

Cafe Name: ${cafeName}
Rating: ${rating}/5
Price Level: ${priceLevel}/4 (${'$'.repeat(priceLevel)})

Recent Reviews:
${reviewText}

Available Categories:
- Coffee: Good coffee quality
- Studying: Quiet, has WiFi/outlets, good for focused work
- Dates: Romantic, cozy atmosphere, good for couples
- Vibes: Great ambiance, aesthetic, Instagrammable
- WiFi: Reliable WiFi for working
- Working: Good for remote work (WiFi, outlets, space)
- Quiet: Peaceful, not noisy, good for concentration
- Groups: Spacious, good for meetups
- Outdoor: Has outdoor seating/patio
- Pastries: Good baked goods, food options

Based on the reviews and data, which categories (2-5 maximum) is this cafe BEST suited for?

Respond with ONLY a JSON array of category names, like: ["Coffee", "Studying", "WiFi"]
`;

      // Call OpenAI through secure proxy
      const content = await OpenAIProxy.chatCompletion([
        {
          role: 'system',
          content: 'You are a cafe categorization expert. Respond only with a JSON array of categories.'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ], { max_tokens: 100 });

      // Parse response
      const categories = JSON.parse(content.trim());

      // Validate categories
      const validCategories = categories.filter((cat: string) =>
        AVAILABLE_CATEGORIES.includes(cat)
      );

      // Always include "Coffee" if it's a cafe
      if (!validCategories.includes('Coffee')) {
        validCategories.unshift('Coffee');
      }

      console.log(`✅ AI categorized ${cafeName}:`, validCategories);

      // Cache the result
      this.cache.set(cacheKey, validCategories);

      return validCategories;
    } catch (error) {
      console.error('❌ AI categorization error:', error);

      // Fallback to basic categorization
      return this.fallbackCategorization(reviews, rating, priceLevel);
    }
  }

  /**
   * Fallback categorization if AI fails (uses heuristics)
   */
  private static fallbackCategorization(
    reviews: string[],
    rating: number,
    priceLevel: number
  ): string[] {
    console.log('⚠️ Using fallback categorization');

    const categories = ['Coffee'];
    const reviewText = reviews.join(' ').toLowerCase();

    // WiFi/Working
    if (reviewText.includes('wifi') || reviewText.includes('laptop') || reviewText.includes('work')) {
      categories.push('WiFi', 'Working');
    }

    // Studying
    if (reviewText.includes('study') || reviewText.includes('quiet')) {
      categories.push('Studying', 'Quiet');
    }

    // Dates/Vibes
    if (rating >= 4.5 && priceLevel >= 2) {
      categories.push('Dates', 'Vibes');
    }

    // Outdoor
    if (reviewText.includes('outdoor') || reviewText.includes('patio')) {
      categories.push('Outdoor');
    }

    // Pastries
    if (reviewText.includes('pastry') || reviewText.includes('croissant') || reviewText.includes('bakery')) {
      categories.push('Pastries');
    }

    // Groups
    if (reviewText.includes('spacious') || reviewText.includes('group')) {
      categories.push('Groups');
    }

    return [...new Set(categories)]; // Remove duplicates
  }

  /**
   * Batch categorize multiple cafes (more efficient)
   */
  static async batchCategorizeCafes(
    cafes: Array<{
      name: string;
      reviews: string[];
      rating: number;
      priceLevel: number;
    }>
  ): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>();

    // Process in parallel (with rate limiting)
    const batchSize = 5; // Process 5 at a time
    for (let i = 0; i < cafes.length; i += batchSize) {
      const batch = cafes.slice(i, i + batchSize);

      const promises = batch.map(async (cafe) => {
        const categories = await this.categorizeCafe(
          cafe.name,
          cafe.reviews,
          cafe.rating,
          cafe.priceLevel
        );
        return { name: cafe.name, categories };
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ name, categories }) => {
        results.set(name, categories);
      });

      // Small delay between batches to avoid rate limits
      if (i + batchSize < cafes.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Generate AI-powered café summary based on reviews
   */
  static async generateCafeSummary(
    cafeName: string,
    reviews: string[],
    rating: number,
    priceLevel: number,
    hours?: { day: string; open: string; close: string }[]
  ): Promise<string> {
    try {
      // Check cache
      const cacheKey = `summary-${cafeName}-${reviews.join('').substring(0, 100)}`;
      if (this.cache.has(cacheKey)) {
        console.log(`✅ Using cached summary for ${cafeName}`);
        return this.cache.get(cacheKey)![0]; // Return first element as string
      }

      console.log(`🤖 Generating AI summary for ${cafeName}...`);
      
      // Format hours for AI context
      const hoursText = hours && hours.length > 0
        ? `\n\nHours:\n${hours.map(h => `${h.day}: ${h.open} - ${h.close}`).join('\n')}`
        : '';

      // Create detailed prompt demanding specificity
      const userPrompt = `
You are a café description expert. Read these ${reviews.length} REAL customer reviews and write a compelling, SPECIFIC summary.

Café Name: ${cafeName}
Rating: ${rating}/5 stars
Price: ${'$'.repeat(priceLevel)}${hoursText}

REAL CUSTOMER REVIEWS:
${reviews.join('\n\n---\n\n')}

Write a compelling 2-3 sentence description (60-90 words) that:
1. Mentions SPECIFIC details from reviews (e.g., "artisan cold brew", "exposed brick walls", "laptop-friendly window seats")
2. Captures the UNIQUE vibe/atmosphere (not generic "cozy" or "great" - be specific!)
3. States what it's BEST known for based on reviews
4. Indicates who would love this place (students, professionals, dates, etc.)
5. IF hours show interesting patterns (like "Open until 10pm" or "Opens at 6am"), mention it naturally

CRITICAL RULES:
- Use SPECIFIC details from the reviews (drink names, food items, decor elements, etc.)
- NO generic phrases like "great place for coffee lovers" or "nice atmosphere"
- Write naturally as if YOU visited - don't say "reviews mention" or "customers say"
- If hours are notable (early/late), weave it in naturally (e.g., "perfect for early risers with 6am opening")
- Be descriptive and vivid!
`;

      const content = await OpenAIProxy.chatCompletion([
        {
          role: 'system',
          content: 'You are a professional café reviewer who writes SPECIFIC, vivid, engaging descriptions using real details from reviews. Never be generic.'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ], { max_tokens: 200 });

      const summary = content.trim() || 'A wonderful café worth visiting.';

      console.log(`✅ Generated summary for ${cafeName}`);

      // Cache the result
      this.cache.set(cacheKey, [summary]);

      return summary;
    } catch (error) {
      console.error('❌ Error generating café summary:', error);
      return `${cafeName} is a highly-rated café offering a great atmosphere and quality beverages.`;
    }
  }

  /**
   * Analyze and categorize reviews by topic (Coffee, Studying, WiFi, etc.)
   */
  static async categorizeFeedback(
    cafeName: string,
    reviews: string[],
    categories: string[]
  ): Promise<Array<{
    category: string;
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    highlights: string[];
  }>> {
    try {
      // Check cache
      const cacheKey = `feedback-${cafeName}-${reviews.join('').substring(0, 100)}`;
      if (this.cache.has(cacheKey)) {
        console.log(`✅ Using cached feedback analysis for ${cafeName}`);
        // Parse the cached JSON string back to object
        const cached = this.cache.get(cacheKey)!;
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }

      console.log(`🤖 Analyzing ${reviews.length} reviews by category for ${cafeName}...`);

      // Create detailed prompt demanding specific insights
      const userPrompt = `
You are an expert at analyzing café reviews. Read these ${reviews.length} REAL customer reviews and extract SPECIFIC, DIVERSE insights for each relevant category.

Café: ${cafeName}
Possible Categories: ${categories.join(', ')}

REAL CUSTOMER REVIEWS:
${reviews.join('\n\n---\n\n')}

INSTRUCTIONS:
1. Read EVERY review carefully and extract SPECIFIC details (not generic phrases)
2. Look for mentions of: coffee quality, food, atmosphere, noise level, WiFi speed, seating, service, study-friendliness, date ambiance, outdoor space, etc.
3. Extract EXACT phrases or close paraphrases from the reviews (use quotes)
4. Include SPECIFIC details: "single-origin pour-over", "laptop-friendly outlets", "cozy fireplace", "loud music", etc.
5. Cover DIVERSE topics - don't just say "good coffee" for everything
6. ONLY include categories that are ACTUALLY discussed in the reviews
7. If a category has mixed reviews, note that in the summary
8. Include 3-5 highlights per category (exact short quotes or specific details)

Respond with ONLY a JSON array (no markdown):
[
  {
    "category": "Coffee",
    "summary": "Specific 1-2 sentence summary with actual details from reviews",
    "sentiment": "positive" | "neutral" | "negative",
    "highlights": ["exact quote 1", "specific detail 2", "actual phrase 3"]
  }
]

CRITICAL: Be SPECIFIC, not generic. Use real details from the reviews!
`;

      const content = await OpenAIProxy.chatCompletion([
        {
          role: 'system',
          content: 'You are a review analysis expert who extracts SPECIFIC, detailed insights from customer reviews. Never use generic phrases. Always pull exact details and quotes from the actual review text. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ], { max_tokens: 800 });
      
      // Remove markdown code blocks if AI includes them
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const categorizedFeedback = JSON.parse(cleanContent);

      console.log(`✅ Analyzed ${categorizedFeedback.length} categories for ${cafeName}`);

      // Cache the result
      this.cache.set(cacheKey, categorizedFeedback);

      return categorizedFeedback;
    } catch (error) {
      console.error('❌ Error categorizing feedback:', error);
      console.error('Error details:', error);
      
      // Return empty array - let the UI handle gracefully
      return [];
    }
  }

  /**
   * Clear the cache (useful for testing or forcing re-analysis)
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ AI categorization cache cleared - all cafés will be re-analyzed');
  }

  /**
   * Get cache stats for debugging
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).map(k => k.substring(0, 50))
    };
  }
}

// Expose cache clearing to console for easy testing
if (typeof window !== 'undefined') {
  (window as any).clearAICache = () => {
    AiCategorizationService.clearCache();
    console.log('✅ Run this command to clear cache: window.clearAICache()');
  };
}
