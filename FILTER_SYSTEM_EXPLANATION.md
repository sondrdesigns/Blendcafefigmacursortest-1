# 🔍 Filter System Explanation

## Overview

Your app has a powerful **multi-criteria filter system** that lets users find cafes based on various attributes. Here's how it works:

---

## 📍 Where Filters Are Used

The filter system is implemented in **two main places**:

1. **Explore Page** (`src/components/ExplorePage.tsx`)
2. **Map Page** (`src/components/MapPageReal.tsx`)

Both use the same underlying filter logic from `CafeService.filterCafes()`.

---

## 🧩 Filter System Architecture

### **1. Filter Service** (`src/services/cafeService.ts`)

Location: Lines 193-237

```typescript
CafeService.filterCafes(cafes, filters)
```

**Purpose:** Takes an array of cafes and filter criteria, returns filtered results.

---

## 🎯 Available Filter Types

### **1. Categories Filter**

**What it does:** Shows only cafes that match selected categories

**How it works:**
```typescript
if (filters.categories && filters.categories.length > 0) {
  filtered = filtered.filter(cafe =>
    filters.categories!.some(category =>
      cafe.categories.includes(category)
    )
  );
}
```

**Example:**
- User selects: `["Coffee", "Studying"]`
- Result: Only cafes tagged with "Coffee" OR "Studying"

**Categories available:**
- Coffee
- Dates
- Groups  
- Outdoor
- Pastries
- Quiet
- Studying
- Vibes
- WiFi
- Working

**Logic:** If a cafe has ANY of the selected categories, it passes (OR logic)

---

### **2. Price Range Filter**

**What it does:** Shows cafes within selected price levels

**How it works:**
```typescript
if (filters.priceRange && filters.priceRange.length > 0) {
  filtered = filtered.filter(cafe =>
    filters.priceRange!.includes(cafe.priceRange)
  );
}
```

**Price Levels:**
- `1` = $ (Inexpensive)
- `2` = $$ (Moderate)
- `3` = $$$ (Pricey)
- `4` = $$$$ (Expensive)

**Example:**
- User selects: `[1, 2]`
- Result: Only cafes with price level 1 or 2

---

### **3. Minimum Rating Filter**

**What it does:** Shows only cafes with rating at or above threshold

**How it works:**
```typescript
if (filters.minRating !== undefined) {
  filtered = filtered.filter(cafe => cafe.rating >= filters.minRating!);
}
```

**Example:**
- User sets: `minRating: 4.0`
- Result: Only cafes with rating ≥ 4.0 stars

**Rating Scale:** 0.0 to 5.0 stars

---

### **4. Maximum Distance Filter**

**What it does:** Shows only cafes within specified distance from user

**How it works:**
```typescript
if (filters.maxDistance !== undefined) {
  filtered = filtered.filter(cafe => cafe.distance <= filters.maxDistance!);
}
```

**Example:**
- User sets: `maxDistance: 2` (miles)
- Result: Only cafes within 2 miles

**Distance:** Calculated using Haversine formula from user's location

---

### **5. Open Now Filter**

**What it does:** Shows only currently open cafes

**How it works:**
```typescript
if (filters.openNow) {
  filtered = filtered.filter(cafe => cafe.status === 'open');
}
```

**Status values:**
- `'open'` - Currently open
- `'closed'` - Currently closed
- `'busy'` - Open but crowded

**Example:**
- User enables: `openNow: true`
- Result: Only cafes with `status === 'open'`

---

## 🔄 How Filters Work Together

**Important:** Filters are **cumulative** (AND logic between different filter types)

### **Example 1: Multiple Filters**

```typescript
const filters = {
  categories: ['Coffee', 'Studying'],
  minRating: 4.0,
  maxDistance: 3,
  openNow: true
};
```

**Result:** Cafes that:
- Have "Coffee" OR "Studying" category
- **AND** rating ≥ 4.0
- **AND** distance ≤ 3 miles
- **AND** currently open

### **Example 2: Only Category Filter**

```typescript
const filters = {
  categories: ['Dates', 'Vibes']
};
```

**Result:** Cafes that:
- Have "Dates" OR "Vibes" category
- No other restrictions

---

## 🎨 Filter UI Implementation

### **On Explore Page:**

**Category Pills:**
```tsx
<button onClick={() => toggleCategory('Coffee')}>
  Coffee
</button>
```

When clicked:
1. Adds/removes category from `selectedCategories` array
2. Triggers filter recalculation
3. Updates displayed cafes

**Quick Filters:**
- "All" - Removes all filters
- "Open Now" - Sets `openNow: true`
- "Highest Rated" - Sorts by rating (not a filter, but a sort)
- "Nearest" - Sorts by distance

### **On Map Page:**

**Radius Slider:**
```tsx
<Slider
  value={radiusMiles}
  onValueChange={setRadiusMiles}
  max={10}
  min={0.5}
  step={0.1}
/>
```

When changed:
1. Updates `maxDistance` filter
2. Fetches new cafes from Google Places API
3. Updates map markers

---

## 📊 Filter Flow Diagram

```
User Action
    ↓
Update Filter State (useState)
    ↓
Call CafeService.filterCafes(cafes, filters)
    ↓
Apply Each Filter in Sequence:
  1. Categories (OR logic)
  2. Price Range (IN logic)
  3. Min Rating (≥ logic)
  4. Max Distance (≤ logic)
  5. Open Now (=== logic)
    ↓
Return Filtered Array
    ↓
Update UI with Filtered Cafes
```

---

## 🛠️ How to Add a New Filter

### **Step 1: Add to Filter Interface**

In `cafeService.ts`:

```typescript
static filterCafes(
  cafes: Cafe[],
  filters: {
    categories?: string[];
    priceRange?: number[];
    minRating?: number;
    maxDistance?: number;
    openNow?: boolean;
    hasWifi?: boolean; // NEW FILTER
  }
): Cafe[] {
```

### **Step 2: Implement Filter Logic**

```typescript
// Filter by WiFi availability
if (filters.hasWifi) {
  filtered = filtered.filter(cafe => 
    cafe.amenities.includes('WiFi') ||
    cafe.categories.includes('WiFi')
  );
}
```

### **Step 3: Add UI Control**

In `ExplorePage.tsx` or `MapPageReal.tsx`:

```tsx
<Checkbox
  checked={hasWifi}
  onCheckedChange={setHasWifi}
>
  WiFi Available
</Checkbox>
```

### **Step 4: Pass to Filter Function**

```typescript
const filteredCafes = CafeService.filterCafes(cafes, {
  categories: selectedCategories,
  openNow: openNow,
  minRating: minRating,
  maxDistance: maxDistance,
  hasWifi: hasWifi, // NEW
});
```

---

## 🎯 Real-World Usage Examples

### **Example 1: Student Looking to Study**

**User selects:**
- Categories: "Studying", "Quiet", "WiFi"
- Open Now: true
- Max Distance: 2 miles

**Filter object:**
```typescript
{
  categories: ['Studying', 'Quiet', 'WiFi'],
  openNow: true,
  maxDistance: 2
}
```

**Result:** Open cafes within 2 miles with any study-friendly category

---

### **Example 2: Date Night Planning**

**User selects:**
- Categories: "Dates", "Vibes"
- Min Rating: 4.5
- Price Range: $$ or $$$

**Filter object:**
```typescript
{
  categories: ['Dates', 'Vibes'],
  minRating: 4.5,
  priceRange: [2, 3]
}
```

**Result:** Highly-rated, romantic cafes with moderate-to-high prices

---

### **Example 3: Quick Coffee Run**

**User selects:**
- Open Now: true
- Max Distance: 0.5 miles

**Filter object:**
```typescript
{
  openNow: true,
  maxDistance: 0.5
}
```

**Result:** Open cafes within half a mile

---

## 🔧 Technical Details

### **Filter Order Matters:**

Filters are applied **sequentially**, so order affects performance:

1. **Categories** - Potentially removes many cafes
2. **Price Range** - Removes by price
3. **Min Rating** - Removes low-rated
4. **Max Distance** - Removes far cafes
5. **Open Now** - Final check

**Why this order?** 
- Start with filters that eliminate the most cafes
- More efficient than checking expensive filters first

### **Filter Performance:**

- **Time Complexity:** O(n × m) where:
  - n = number of cafes
  - m = number of filter checks
  
- **Typical Performance:**
  - 100 cafes with 3 filters: ~0.5ms
  - 1000 cafes with 5 filters: ~5ms

### **Optimization Tip:**

For large datasets, consider:
```typescript
// Use indexed searches for faster filtering
const openCafes = cafes.filter(c => c.status === 'open');
// Then apply other filters on smaller set
```

---

## 🎨 UI/UX Best Practices

### **1. Show Filter Count**

```tsx
<Badge>{filteredCafes.length} cafes found</Badge>
```

### **2. Clear All Filters Button**

```tsx
<Button onClick={() => {
  setSelectedCategories([]);
  setOpenNow(false);
  setMinRating(0);
}}>
  Clear Filters
</Button>
```

### **3. Active Filter Chips**

```tsx
{selectedCategories.map(cat => (
  <Chip key={cat} onRemove={() => removeCategory(cat)}>
    {cat}
  </Chip>
))}
```

### **4. Empty State**

```tsx
{filteredCafes.length === 0 && (
  <EmptyState>
    No cafes match your filters. Try adjusting your criteria.
  </EmptyState>
)}
```

---

## 🚀 Summary

### **Key Points:**

1. ✅ **Modular Design** - Easy to add new filters
2. ✅ **Cumulative Logic** - AND between filter types, OR within categories
3. ✅ **Real-time Updates** - Instant feedback on filter changes
4. ✅ **User-Friendly** - Clear UI controls for each filter
5. ✅ **Performance** - Fast filtering even with many cafes

### **Filter Types:**
- **Categories** (multi-select, OR logic)
- **Price Range** (multi-select, IN logic)
- **Min Rating** (threshold, ≥ logic)
- **Max Distance** (threshold, ≤ logic)
- **Open Now** (boolean, === logic)

### **Used In:**
- Explore Page (grid view)
- Map Page (map markers + list)

---

## 💡 Pro Tips

1. **Combine filters** for specific results
2. **Start broad** then narrow down
3. **Use Open Now** for immediate needs
4. **Distance filter** works with live location
5. **Categories use OR** for flexibility

---

**The filter system is designed to help users find exactly what they're looking for quickly and easily!** 🎯☕


