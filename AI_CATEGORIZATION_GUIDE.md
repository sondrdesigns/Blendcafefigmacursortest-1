# 🤖 AI-Powered Cafe Categorization Guide

## Overview

Your app now uses **OpenAI GPT-4** to intelligently analyze Google reviews and automatically assign the best categories to cafes!

---

## ✨ What It Does

Instead of generic categories like just "Coffee", the AI reads actual customer reviews and determines if a cafe is good for:

- ☕ **Coffee** - Quality coffee
- 📚 **Studying** - Quiet, WiFi, outlets
- 💑 **Dates** - Romantic, cozy ambiance
- ✨ **Vibes** - Great atmosphere, aesthetic
- 📶 **WiFi** - Reliable internet
- 💼 **Working** - Remote work friendly
- 🤫 **Quiet** - Peaceful environment
- 👥 **Groups** - Spacious, social
- 🌳 **Outdoor** - Patio/outdoor seating
- 🥐 **Pastries** - Good baked goods

---

## 🔑 Step 1: Get Your OpenAI API Key

### **1. Create OpenAI Account**

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Click **"Sign Up"** (or log in if you have an account)
3. Verify your email

### **2. Get API Key**

1. Go to [API Keys Page](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Give it a name (e.g., "Blend Cafe App")
4. Click **"Create secret key"**
5. **COPY THE KEY** (you won't see it again!)

It will look like: `sk-xxxx-your-key-here`

### **3. Add Billing**

⚠️ **Important:** OpenAI requires billing info (but charges are minimal)

1. Go to [Billing](https://platform.openai.com/account/billing)
2. Click **"Add payment method"**
3. Add credit card
4. Set usage limit (recommended: $5-10/month)

**Cost Estimate:**
- GPT-4o-mini: ~$0.15 per 1M tokens
- Categorizing 100 cafes: ~$0.10
- Monthly cost: Usually under $2

---

## ⚙️ Step 2: Configure Your App

### **Add API Key to `.env`**

Open `/Users/toshin/Desktop/Blendcafefigmacursortest/.env`

Replace:
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

With your actual key:
```env
VITE_OPENAI_API_KEY=sk-xxxx-your-api-key-here
```

### **Restart Your Dev Server**

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🚀 Step 3: Test It!

### **Watch the Console**

1. Open your app: http://localhost:3000/
2. Open browser console (F12)
3. Navigate to **Explore** or **Map** page
4. Watch for AI categorization logs:

```
🔍 Searching for cafes near: ...
📍 Places API Status: OK
✅ Found 10 cafes
🤖 Starting AI categorization...
🤖 AI analyzing Artisan Coffee House...
✅ AI categorized "Artisan Coffee House": ["Coffee", "Studying", "WiFi", "Quiet"]
🤖 AI analyzing Cozy Corner Cafe...
✅ AI categorized "Cozy Corner Cafe": ["Coffee", "Dates", "Vibes", "Pastries"]
```

### **Verify Categories**

1. Look at cafe cards
2. Categories should now be **intelligent** based on reviews!
3. Filter by "Studying" → Only study-friendly cafes
4. Filter by "Dates" → Only romantic cafes

---

## 🎯 How It Works

### **The AI Analysis Process:**

1. **Fetch Cafes** from Google Places API
2. **Get Reviews** (first 5 reviews per cafe)
3. **Send to OpenAI** with this prompt:

```
Cafe: Artisan Coffee House
Rating: 4.8/5
Price: $$

Reviews:
"Great place to study! Fast WiFi and lots of outlets..."
"Perfect quiet spot for getting work done..."
"Love the peaceful atmosphere, great for focus..."

Which categories is this cafe best for?
Options: Coffee, Studying, Dates, Vibes, WiFi, Working, Quiet, Groups, Outdoor, Pastries

Respond with JSON array: ["Coffee", "Studying", "WiFi", "Quiet"]
```

4. **GPT-4 Analyzes** review content
5. **Returns Categories** based on actual user experiences
6. **Updates Cafe** with smart categories

---

## ⚡ Performance & Optimization

### **Caching**

AI results are **cached** to avoid repeat API calls:
- Same cafe analyzed twice? Uses cache (free!)
- Cache clears on page refresh

### **Batch Processing**

Cafes are processed in **batches of 3** to avoid rate limits:
- Batch 1: Cafes 1-3
- Wait 500ms
- Batch 2: Cafes 4-6
- etc.

### **Fallback System**

If AI fails, uses **smart heuristics**:
- Keywords in reviews (wifi, quiet, study)
- Rating + price combo
- Review sentiment

---

## 🎛️ Configuration Options

### **Turn AI On/Off**

In `src/services/googleMapsService.ts`:

```typescript
const USE_AI_CATEGORIZATION = true; // false to disable
```

### **Change AI Model**

In `src/services/aiCategorizationService.ts`:

```typescript
model: 'gpt-4o-mini', // Fast & cheap
// OR
model: 'gpt-4o',      // More accurate, more expensive
// OR  
model: 'gpt-3.5-turbo', // Cheapest
```

### **Adjust Number of Reviews**

```typescript
// Use more reviews for better accuracy
const reviewText = reviews.slice(0, 10).join('\n\n'); // Use 10 instead of 5
```

---

## 💰 Cost Management

### **Typical Costs:**

| Action | Tokens Used | Cost |
|--------|-------------|------|
| Categorize 1 cafe | ~500 tokens | $0.001 |
| Categorize 10 cafes | ~5,000 tokens | $0.01 |
| Categorize 100 cafes | ~50,000 tokens | $0.10 |

### **Set Usage Limits:**

1. Go to [OpenAI Usage](https://platform.openai.com/usage)
2. Set monthly limit: $5 or $10
3. Get email alerts at 75% and 90%

### **Monitor Usage:**

```typescript
// Add to console
console.log('AI calls made:', AiCategorizationService.cache.size);
```

---

## 🐛 Troubleshooting

### **"OpenAI API key not configured"**

**Fix:**
1. Check `.env` file has correct key
2. Key starts with `sk-proj-` or `sk-`
3. Restart dev server

### **"Insufficient quota" Error**

**Fix:**
1. Add billing at [OpenAI Billing](https://platform.openai.com/account/billing)
2. Add $5-10 credit
3. Wait 5 minutes for activation

### **AI Not Running**

**Check:**
1. Browser console shows "🤖 Starting AI categorization..."
2. If not, check `USE_AI_CATEGORIZATION = true`
3. Verify API key in `.env`

### **Rate Limit Errors**

**Fix:**
1. Increase batch delay (500ms → 1000ms)
2. Reduce batch size (3 → 2)
3. Upgrade OpenAI plan for higher limits

---

## 📊 Example Results

### **Before AI (Basic):**
```
Cafe: Blue Bottle Coffee
Categories: ["Coffee"]
```

### **After AI (Smart):**
```
Cafe: Blue Bottle Coffee
Reviews analyzed:
- "Perfect for working, fast wifi and quiet"
- "Love studying here on weekends"
- "Great outlets, peaceful atmosphere"

AI Categories: ["Coffee", "Working", "WiFi", "Studying", "Quiet"]
```

---

## 🎯 Best Practices

1. **Start Small:** Test with a few cafes first
2. **Monitor Costs:** Check usage weekly
3. **Use Caching:** Don't clear cache unnecessarily
4. **Batch Process:** Process 3-5 cafes at a time
5. **Fallback Ready:** Always have heuristics as backup

---

## 🔐 Security

### **Important:**

⚠️ **Never commit `.env` to Git!** (already in `.gitignore`)

⚠️ **API key exposed in browser** (using `dangerouslyAllowBrowser: true`)

**For Production:**
- Move AI to backend API
- Never expose OpenAI key in frontend
- Use server-side API routes

### **Current Setup:**
- ✅ Good for development/testing
- ❌ Not for production
- 🔄 Migrate to backend before launch

---

## 📈 Upgrade Path

### **Phase 1 (Current):** Client-Side AI
- OpenAI calls from browser
- Good for prototyping

### **Phase 2:** Backend API
```
Frontend → Your Backend → OpenAI
```
- More secure
- Better rate limiting
- Centralized caching

### **Phase 3:** Full Stack
- Pre-process all cafes nightly
- Store categories in database
- Instant loading (no API calls)

---

## ✅ Checklist

Before going live:

- [ ] Got OpenAI API key
- [ ] Added to `.env` file
- [ ] Tested AI categorization
- [ ] Set usage limits
- [ ] Verified costs are acceptable
- [ ] Considered moving to backend

---

## 🎉 You're All Set!

Your app now has **intelligent, AI-powered cafe categorization**!

Users will see **accurate, review-based categories** that truly reflect what makes each cafe special.

**Test it now:**
1. Open http://localhost:3000/
2. Go to Explore or Map page
3. Watch the magic happen! ✨

---

## 📞 Need Help?

- [OpenAI Documentation](https://platform.openai.com/docs)
- [OpenAI Community](https://community.openai.com/)
- Check browser console for error messages
- Review `aiCategorizationService.ts` for logic

**Happy categorizing!** 🤖☕


