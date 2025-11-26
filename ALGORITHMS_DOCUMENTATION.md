# Algorithms Used in Local Sewa Project

## Overview
This document lists all algorithms and intelligent systems used in the Local Sewa application, organized by functionality.

---

## 1. SERVICE RECOMMENDATION ALGORITHM
**Location:** `project/src/pages/user/Services.tsx`

**Purpose:** Rank and sort services based on multiple factors to show most relevant services first.

**Algorithm:**
```
Recommendation Score = (Rating Score × 0.4) + 
                       (Popularity Score × 0.3) + 
                       (Vendor Bonus × 0.2) + 
                       (Locality Match × 0.1)

Where:
- Rating Score = (service.rating / 5)
- Popularity Score = min(service.bookingCount / 100, 1)
- Vendor Bonus = 0.2 if vendor service, else 0
- Locality Match = 0.1 if matches selected area, else 0
```

**Factors:**
- **40%** - Service Rating (quality indicator)
- **30%** - Booking Count (popularity indicator)
- **20%** - Vendor Priority (real vendors over demos)
- **10%** - Locality Match (local services bonus)

**Use Case:** Automatically sorts services to show best options first

---

## 2. SMART SEARCH ALGORITHM (Cosine Similarity)
**Location:** `backend/index.js` - `searchServicesUsingCosine()`

**Purpose:** Intelligent text-based search using vector similarity.

**Algorithm:**
```
1. Tokenization:
   - Convert query to lowercase
   - Remove special characters
   - Split into words
   - Remove stop words (a, an, the, etc.)

2. Vectorization:
   - Create frequency map of tokens
   - Build vector for query
   - Build vector for each service (name + description + category + tags)

3. Cosine Similarity:
   similarity = (A · B) / (||A|| × ||B||)
   
   Where:
   - A · B = dot product of vectors
   - ||A|| = magnitude of vector A
   - ||B|| = magnitude of vector B

4. Ranking:
   - Filter services with similarity > 0
   - Sort by similarity score (highest first)
```

**Use Case:** Search services by typing natural language queries

---

## 3. CV SCORING ALGORITHM
**Location:** `backend/index.js` - `evaluateCvFile()`

**Purpose:** Automatically evaluate vendor CVs and assign quality scores.

**Algorithm:**
```
CV Score = (Skill Score × 0.45) + 
           (Experience Score × 0.30) + 
           (Certification Score × 0.15) + 
           (Management Score × 0.10)

Where:
- Skill Score = min(unique_keywords / 14, 1)
- Experience Score = min(years_experience / 12, 1)
- Certification Score = min(certifications_count / 5, 1)
- Management Score = min(management_mentions / 5, 1)
```

**Keyword Detection:**
- Extracts text from PDF
- Searches for category-specific keywords
- Counts unique skill mentions
- Detects experience years (regex: "X years")
- Finds certifications (keywords: "certified", "license")
- Identifies management experience

**Use Case:** Automatically vet vendors before admin approval

---

## 4. SMART SCORE ALGORITHM
**Location:** `backend/index.js` - `computeSmartScore()`

**Purpose:** Calculate overall vendor quality score combining CV and performance.

**Algorithm:**
```
Smart Score = (CV Score × 0.6) + 
              (Booking Signal × 0.3) + 
              (Preference Boost × 0.1)

Where:
- CV Score = from CV evaluation (0-1)
- Booking Signal = log(1 + bookingCount) / log(101)
- Preference Boost = manual boost (0-1)
```

**Use Case:** Rank vendors by overall quality and reliability

---

## 5. HAVERSINE DISTANCE ALGORITHM
**Location:** `backend/index.js` - `haversineDistance()`

**Purpose:** Calculate geographic distance between two coordinates.

**Algorithm:**
```
Given: lat1, lon1, lat2, lon2 (in degrees)

1. Convert to radians:
   φ1 = lat1 × π/180
   φ2 = lat2 × π/180
   Δφ = (lat2 - lat1) × π/180
   Δλ = (lon2 - lon1) × π/180

2. Haversine formula:
   a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
   c = 2 × atan2(√a, √(1-a))
   distance = R × c

Where R = 6371 km (Earth's radius)
```

**Use Case:** Find nearby services and calculate service radius

---

## 6. DIJKSTRA'S SHORTEST PATH ALGORITHM
**Location:** `backend/constants/kathmanduAreas.js` - `dijkstraShortestRoute()`

**Purpose:** Find shortest route between two Kathmandu localities.

**Algorithm:**
```
1. Initialize:
   - Set distance to start = 0
   - Set all other distances = ∞
   - Create priority queue

2. While queue not empty:
   - Extract node with minimum distance
   - For each neighbor:
     - Calculate new distance
     - If new distance < current distance:
       - Update distance
       - Update previous node
       - Add to queue

3. Reconstruct path:
   - Backtrack from destination to start
   - Return path and total distance
```

**Use Case:** Calculate optimal routes between areas for service delivery

---

## 7. NEARBY ALTERNATIVES ALGORITHM
**Location:** `backend/index.js` - `findNearestAlternatives()`

**Purpose:** Find alternative service providers when primary choice unavailable.

**Algorithm:**
```
1. Define search radii: [3km, 6km, 12km, 20km]

2. For each radius (expanding):
   a. Query providers within radius using geo-spatial index
   b. Filter by category match
   c. Check booking conflicts (date/time)
   d. Calculate distance for each provider
   e. Sort by distance
   f. Collect up to limit
   g. If limit reached, stop

3. Return collected alternatives with distance info
```

**Use Case:** Suggest nearby providers when selected one is booked

---

## 8. LOCALITY AUTOCOMPLETE ALGORITHM
**Location:** `project/src/components/LocalityAutocomplete.tsx`

**Purpose:** Intelligent locality search with fuzzy matching.

**Algorithm:**
```
1. Exact Match:
   - Check if input matches locality name

2. Partial Match:
   - Check if locality name contains input
   - Example: "Tink" matches "Tinkune"

3. Slug Match:
   - Check if slug contains input
   - Example: "tink" matches "tinkune"

4. District Match:
   - Check if district contains input
   - Example: "Kathmandu" matches all Kathmandu areas

5. Spelling Variants:
   - Predefined variants map
   - Example: "Boudha" ↔ "Bouddha" ↔ "Bodha"

6. Case Insensitive:
   - All comparisons in lowercase
```

**Use Case:** Help users find localities even with typos or partial input

---

## 9. REVIEW AGGREGATION ALGORITHM
**Location:** `backend/index.js` - `updateServiceReviewStats()`

**Purpose:** Calculate service ratings and review distribution.

**Algorithm:**
```
Using MongoDB Aggregation Pipeline:

1. Match: Filter published reviews for service
2. Group by service:
   - Count total reviews
   - Calculate average rating
   - Find latest review date
   - Count 5-star reviews
   - Count 4-star reviews
   - Count 3-star reviews
   - Count 2-star reviews
   - Count 1-star reviews

3. Format output:
   {
     total: count,
     average: avg (rounded to 2 decimals),
     lastReviewAt: date,
     distribution: { five, four, three, two, one }
   }
```

**Use Case:** Display accurate service ratings and review statistics

---

## 10. SENTIMENT ANALYSIS ALGORITHM
**Location:** `backend/index.js` - `computeSentimentFromRating()`

**Purpose:** Classify review sentiment based on rating.

**Algorithm:**
```
if rating >= 4:
    sentiment = POSITIVE
elif rating <= 2:
    sentiment = NEGATIVE
else:
    sentiment = NEUTRAL
```

**Use Case:** Categorize reviews for filtering and analysis

---

## 11. BOOKING CONFLICT DETECTION
**Location:** `backend/index.js` - `/create-booking` endpoint

**Purpose:** Prevent double-booking of providers.

**Algorithm:**
```
1. Query existing bookings:
   - Same provider
   - Same date
   - Same time
   - Status != CANCELLED

2. If match found:
   - Return 409 Conflict
   - Suggest alternatives using Nearby Alternatives Algorithm

3. If no match:
   - Create booking
   - Return confirmation
```

**Use Case:** Ensure providers aren't double-booked

---

## 12. CATEGORY DETECTION ALGORITHM
**Location:** `backend/index.js` - `detectCategoryFromMessage()`

**Purpose:** Extract service category from natural language.

**Algorithm:**
```
1. Convert message to lowercase

2. Check direct category match:
   - If message contains "plumbing" → plumbing
   - If message contains "electrical" → electrical
   - etc.

3. Check synonym match:
   - "pipe", "leak", "tap" → plumbing
   - "wiring", "light", "breaker" → electrical
   - "clean", "sweep", "maid" → cleaning
   - etc.

4. Return first match or null
```

**Use Case:** Chatbot understands user intent from natural language

---

## 13. BUDGET DETECTION ALGORITHM
**Location:** `backend/index.js` - `detectBudgetCeiling()`

**Purpose:** Extract price limit from user message.

**Algorithm:**
```
1. Remove commas from message
2. Convert to lowercase

3. Regex pattern:
   /(under|below|less than|upto|up to)\s*(\d+(?:\.\d+)?)(k|m)?/

4. Extract number and multiplier:
   - If 'k' → multiply by 1,000
   - If 'm' → multiply by 1,000,000

5. Return budget ceiling or null
```

**Use Case:** Filter services by user's budget in chatbot

---

## 14. AREA DETECTION ALGORITHM
**Location:** `backend/index.js` - `detectAreaFromMessage()`

**Purpose:** Identify Kathmandu locality from user message.

**Algorithm:**
```
1. Convert message to lowercase

2. For each known area:
   - Check if message contains area name
   - Check if message contains area slug

3. Return first match or null
```

**Use Case:** Understand location context in chatbot queries

---

## 15. SERVICE FILTERING BY BUDGET
**Location:** `backend/index.js` - `filterServicesByBudget()`

**Purpose:** Filter services within price range.

**Algorithm:**
```
if budgetCeiling exists:
    return services where price <= budgetCeiling
else:
    return all services
```

**Use Case:** Show only affordable services to users

---

## 16. BOOKING STATUS TIMELINE
**Location:** `backend/index.js` - `recordStatusChange()`

**Purpose:** Track booking status history.

**Algorithm:**
```
1. Validate status is in allowed list
2. Create timeline entry:
   - status
   - note
   - changedBy (actor)
   - changedAt (timestamp)
3. Append to booking.statusTimeline array
4. Update booking.status to new status
```

**Use Case:** Audit trail for booking lifecycle

---

## 17. PRICE HISTORY TRACKING
**Location:** `backend/index.js` - Service update endpoints

**Purpose:** Track service price changes over time.

**Algorithm:**
```
When price changes:
1. Create price history entry:
   {
     amount: new_price,
     currency: "NPR",
     effectiveFrom: current_date
   }
2. Push to service.priceHistory array
3. Update service.price to new value
```

**Use Case:** Price transparency and historical analysis

---

## 18. RISK FLAG DETECTION (CV)
**Location:** `backend/index.js` - `detectRiskFlags()`

**Purpose:** Identify potential issues in vendor CVs.

**Algorithm:**
```
Risk patterns:
- "terminated" → employment_gap
- "fired" → employment_gap
- "pending case" → compliance_flag
- "no experience" → experience_gap

For each pattern:
    if CV text contains pattern:
        add flag to list

Return unique flags
```

**Use Case:** Alert admins to potential vendor issues

---

## 19. MARKETPLACE SORTING ALGORITHM
**Location:** `backend/index.js` - `sortServicesForMarketplace()`

**Purpose:** Sort services for marketplace display.

**Algorithm:**
```
1. Core services first:
   if a.isCore and not b.isCore: a comes first
   if b.isCore and not a.isCore: b comes first

2. Among core services:
   Sort by systemRank (ascending)

3. Among vendor services:
   a. Sort by bookingCount (descending)
   b. If equal, sort by createdAt (newest first)
```

**Use Case:** Consistent service ordering in marketplace

---

## 20. RETRY INTERCEPTOR ALGORITHM
**Location:** `project/src/api/client.ts`

**Purpose:** Automatically retry failed API requests.

**Algorithm:**
```
On request failure:
1. Check if retryable:
   - Network error (ERR_NETWORK)
   - Timeout (ECONNABORTED)
   - Server error (status >= 500)
   - No response received

2. If retryable and retries < 1:
   - Increment retry count
   - Wait 500ms
   - Retry request

3. Else:
   - Return error to caller
```

**Use Case:** Improve reliability of API calls

---

## Summary

**Total Algorithms: 20**

### By Category:
- **Search & Discovery:** 4 algorithms (Cosine Search, Locality Autocomplete, Category Detection, Area Detection)
- **Recommendation & Ranking:** 3 algorithms (Service Recommendation, Smart Score, Marketplace Sorting)
- **Geographic:** 3 algorithms (Haversine Distance, Dijkstra's Path, Nearby Alternatives)
- **Quality Assessment:** 3 algorithms (CV Scoring, Risk Detection, Review Aggregation)
- **Natural Language:** 3 algorithms (Category Detection, Budget Detection, Sentiment Analysis)
- **Business Logic:** 4 algorithms (Booking Conflict, Price History, Status Timeline, Budget Filtering)

### Complexity Levels:
- **Simple:** 8 algorithms (O(1) to O(n))
- **Moderate:** 8 algorithms (O(n log n) to O(n²))
- **Complex:** 4 algorithms (O(n²) to O(n³))

### Most Impactful:
1. Service Recommendation Algorithm (affects all users)
2. Cosine Similarity Search (core search functionality)
3. CV Scoring Algorithm (vendor quality control)
4. Haversine Distance (location-based services)
5. Nearby Alternatives (improves booking success rate)
