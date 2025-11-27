# 📍 Locality Search Algorithm Documentation

## समस्या (Problem)
जब user ले Tinkune search गर्छ:
- पहिले **Tinkune को exact services** देखाउनु पर्छ (API + Hardcoded दुवै)
- यदि Tinkune मा कुनै services छैनन्, त्यसपछि मात्र **nearby areas** को services देखाउनु पर्छ
- Services booked छन् कि छैनन् भनेर पनि check गर्नु पर्छ

---

## ✅ समाधान (Solution)

### **Algorithm: Locality-Based Service Filtering with Fallback**

**Location:** `project/src/pages/user/Services.tsx` (Lines 550-585)

---

## 🔍 Algorithm Steps

### **Step 1: Exact Locality Match (Priority 1)**
```typescript
// Get hardcoded services from exact locality
const exactLocalityHardcoded = HARDCODED_SERVICES.filter(
  (service: any) => service.localitySlug === selectedArea.slug
);

// Combine API services with hardcoded services from exact locality
const exactLocalityServices = [...localityServices, ...exactLocalityHardcoded];
```

**Purpose:** 
- Tinkune search गर्दा, Tinkune को सबै services (API + Hardcoded) देखाउनु
- Exact locality match लाई highest priority दिनु

---

### **Step 2: Check Availability**
```typescript
if (exactLocalityServices.length > 0) {
  // Show services from exact locality (both API and hardcoded)
  filteredServices = exactLocalityServices;
}
```

**Purpose:**
- यदि exact locality मा services छन्, ती देखाउनु
- API र Hardcoded दुवै services combine गरेर देखाउनु

---

### **Step 3: Nearby Fallback (Priority 2)**
```typescript
else if (showingNearby && nearbyServices.length > 0) {
  // No services in exact locality, show nearby API services
  filteredServices = nearbyServices;
}
```

**Purpose:**
- यदि exact locality मा कुनै services छैनन्
- User ले "Show nearby services" button click गरेको छ
- त्यसपछि मात्र nearby areas को services देखाउनु

---

### **Step 4: No Results**
```typescript
else {
  // No services found at all
  filteredServices = [];
}
```

**Purpose:**
- यदि कतै पनि services छैनन्
- Empty array return गर्नु

---

## 🎯 Related Algorithms

### **1. Nearby Services Fetch Algorithm**
**Location:** `project/src/pages/user/Services.tsx` (Lines 470-510)

```typescript
const fetchLocalityServices = async () => {
  try {
    // First try 3km radius for exact locality
    const response = await areasApi.getServicesByArea(selectedArea.slug, {
      radiusKm: 3,
    });

    const services = response.data.services || [];
    setLocalityServices(services);

    // If no services in the area, fetch nearby alternatives
    if (services.length === 0) {
      const nearbyResponse = await areasApi.getServicesByArea(
        selectedArea.slug,
        {
          radiusKm: 10, // Expand to 10km for nearby
        }
      );
      setNearbyServices(nearbyResponse.data.services || []);
    }
  } catch (error) {
    console.error("Failed to fetch locality services:", error);
  }
};
```

**Algorithm Name:** Radius-Based Service Discovery
**Purpose:** 
- पहिले 3km radius मा search गर्नु
- यदि services छैनन्, 10km radius मा expand गर्नु

---

### **2. Haversine Distance Algorithm**
**Location:** `backend/constants/kathmanduAreas.js` (Lines 380-400)

```javascript
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}
```

**Algorithm Name:** Haversine Formula
**Purpose:** Calculate distance between two GPS coordinates
**Used For:** Sorting services by proximity

---

### **3. Service Recommendation Algorithm**
**Location:** `project/src/pages/user/Services.tsx` (Lines 515-545)

```typescript
const getRecommendationScore = (service: any) => {
  let score = 0;
  
  // 1. Rating weight (40%)
  const ratingScore = (service.rating || 4.5) / 5;
  score += ratingScore * 0.4;
  
  // 2. Popularity weight (30%) - based on booking count
  const maxBookings = 100;
  const popularityScore = Math.min((service.bookingCount || 0) / maxBookings, 1);
  score += popularityScore * 0.3;
  
  // 3. Vendor priority (20%) - vendor services ranked higher
  const vendorBonus = !service.isHardcoded ? 0.2 : 0;
  score += vendorBonus;
  
  // 4. Locality match (10%) - if user selected a locality
  if (selectedArea && service.localitySlug === selectedArea.slug) {
    score += 0.1;
  }
  
  return score;
};
```

**Algorithm Name:** Multi-Factor Recommendation Scoring
**Factors:**
- 40% - Service rating (quality)
- 30% - Booking count (popularity)
- 20% - Vendor vs Hardcoded (vendor priority)
- 10% - Locality match (proximity bonus)

---

### **4. Area Detection Algorithm**
**Location:** `backend/constants/kathmanduAreas.js` (Lines 450-470)

```javascript
export function findAreaByIdentifier(identifier) {
  if (!identifier) return null;
  const normalized = identifier.toLowerCase().trim();
  
  return KATHMANDU_AREAS.find(
    (area) =>
      area.slug === normalized ||
      area.name.toLowerCase() === normalized ||
      area.tags?.some((tag) => tag.toLowerCase() === normalized)
  );
}
```

**Algorithm Name:** Fuzzy Area Matching
**Purpose:** Match user input to Kathmandu areas
**Matches:** slug, name, or tags

---

## 📊 Complete Flow Diagram

```
User selects "Tinkune"
        ↓
┌───────────────────────────────────────┐
│ Step 1: Fetch API Services (3km)     │
│ GET /areas/tinkune/services?radius=3  │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ Step 2: Filter Hardcoded Services    │
│ localitySlug === "tinkune"            │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ Step 3: Combine Both                 │
│ exactLocalityServices = API + HC      │
└───────────────────────────────────────┘
        ↓
    Has services?
        ↓
    YES → Show exact locality services
        ↓
    NO → Check nearby (10km radius)
        ↓
    Has nearby?
        ↓
    YES → Show "No services in Tinkune" message
          with button to show nearby
        ↓
    NO → Show "No services found" message
```

---

## 🔧 Backend API Endpoints

### **1. Get Services by Area**
**Endpoint:** `GET /areas/:slug/services`
**Location:** `backend/index.js` (Lines 3350-3400)

**Parameters:**
- `radiusKm` - Search radius in kilometers (default: 5)
- `category` - Filter by service category
- `onlyReviewed` - Only show reviewed services
- `cvQualified` - Only show CV-qualified providers

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "_id": "svc123",
      "name": "Home Plumbing Service",
      "price": 1500,
      "provider": {
        "name": "Tinkune Plumbing",
        "location": {
          "coordinates": [85.3240, 27.7172]
        }
      },
      "distanceKm": 0.5
    }
  ],
  "area": {
    "slug": "tinkune",
    "name": "Tinkune"
  }
}
```

---

## 📝 Example Scenarios

### **Scenario 1: Tinkune मा services छन्**

**Input:** User selects "Tinkune"

**Process:**
1. API call: `/areas/tinkune/services?radiusKm=3`
2. Returns: 2 API services
3. Filter hardcoded: 1 hardcoded service (Home Plumbing Service)
4. Combine: 3 total services

**Output:** Shows 3 services from Tinkune

---

### **Scenario 2: Tinkune मा services छैनन्**

**Input:** User selects "Tinkune"

**Process:**
1. API call: `/areas/tinkune/services?radiusKm=3`
2. Returns: 0 API services
3. Filter hardcoded: 0 hardcoded services
4. Fetch nearby: `/areas/tinkune/services?radiusKm=10`
5. Returns: 5 nearby services

**Output:** 
- Shows message: "No services available in Tinkune"
- Shows button: "Show services near this area"
- User clicks → Shows 5 nearby services

---

### **Scenario 3: Search query with locality**

**Input:** 
- Locality: "Tinkune"
- Search: "plumber"

**Process:**
1. Get Tinkune services (API + Hardcoded)
2. Filter by search query "plumber"
3. Apply recommendation scoring

**Output:** Shows only plumbing services from Tinkune

---

## 🎯 Algorithm Summary

| Algorithm | Location | Purpose | Line Numbers |
|-----------|----------|---------|--------------|
| **Locality-Based Filtering** | `Services.tsx` | Filter services by exact locality | 550-585 |
| **Radius-Based Discovery** | `Services.tsx` | Fetch nearby services | 470-510 |
| **Haversine Distance** | `kathmanduAreas.js` | Calculate GPS distance | 380-400 |
| **Recommendation Scoring** | `Services.tsx` | Rank services by quality | 515-545 |
| **Area Detection** | `kathmanduAreas.js` | Match user input to areas | 450-470 |
| **Dijkstra's Shortest Path** | `kathmanduAreas.js` | Find shortest route | 431-480 |
| **Cosine Similarity Search** | `index.js` | Text-based service search | 689-737 |

---

## 🚀 Key Improvements Made

### **Before:**
```typescript
// Only showed API services OR hardcoded services
if (localityServices.length > 0) {
  filteredServices = localityServices; // Only API
} else {
  filteredServices = HARDCODED_SERVICES.filter(...); // Only Hardcoded
}
```

### **After:**
```typescript
// Shows BOTH API and hardcoded services from exact locality
const exactLocalityHardcoded = HARDCODED_SERVICES.filter(
  (service: any) => service.localitySlug === selectedArea.slug
);
const exactLocalityServices = [...localityServices, ...exactLocalityHardcoded];

if (exactLocalityServices.length > 0) {
  filteredServices = exactLocalityServices; // Both API + Hardcoded
}
```

---

## ✅ Benefits

1. **Complete Coverage** - Shows all services from exact locality
2. **Smart Fallback** - Only shows nearby when necessary
3. **User Control** - User decides when to see nearby services
4. **Better UX** - Clear messaging about availability
5. **Accurate Results** - Combines multiple data sources

---

## 🔮 Future Enhancements

1. **Booking Status Check** - Show if service is fully booked
2. **Real-time Availability** - Check provider availability
3. **Time-based Filtering** - Show services available at specific times
4. **Price Range Filtering** - Filter by budget
5. **Rating Filtering** - Show only 4+ star services
