# Dijkstra's Algorithm & AI Chatbot Guide

## 📍 DIJKSTRA'S ALGORITHM

### **Purpose**
Calculates the **shortest route** between two Kathmandu localities for optimal service delivery planning.

### **Location**
- **Backend:** `backend/constants/kathmanduAreas.js` - `dijkstraShortestRoute()`
- **API Endpoint:** `POST /routes/shortest`

### **How It Works**
1. Takes two area slugs (e.g., "tinkune" and "baneshwor")
2. Builds a weighted graph of all Kathmandu areas with real distances
3. Uses Dijkstra's algorithm to find the shortest path
4. Returns the optimal route with total distance in kilometers

### **API Usage**
```javascript
// Request
POST /routes/shortest
{
  "from": "tinkune",
  "to": "baneshwor"
}

// Response
{
  "success": true,
  "route": {
    "distanceKm": 3.5,
    "path": [
      { "slug": "tinkune", "name": "Tinkune", "coordinates": {...} },
      { "slug": "koteshwor", "name": "Koteshwor", "coordinates": {...} },
      { "slug": "baneshwor", "name": "Baneshwor", "coordinates": {...} }
    ]
  }
}
```

### **Current Status**
⚠️ **NOT currently used in the frontend** - Available for future features

### **Potential Use Cases**
1. **Route Planning** - Help service providers plan optimal delivery routes
2. **Time Estimation** - Calculate estimated travel time between locations
3. **Service Area Coverage** - Visualize provider service radius
4. **Distance-Based Pricing** - Adjust prices based on travel distance
5. **Multi-Stop Optimization** - Plan routes with multiple service locations

---

## 🤖 AI CHATBOT

### **Purpose**
Intelligent service discovery assistant that understands natural language queries and provides personalized service recommendations.

### **Location**
- **Frontend:** `project/src/components/Chatbot.tsx`
- **Backend:** `backend/index.js` - `POST /chatbot`

### **Features**
1. ✅ **Multi-Query Support** - Tracks conversation history with question numbering
2. ✅ **Natural Language Processing** - Understands casual queries
3. ✅ **Category Detection** - Automatically identifies service categories
4. ✅ **Budget Detection** - Extracts price limits from queries
5. ✅ **Location Detection** - Identifies Kathmandu areas mentioned
6. ✅ **Smart Recommendations** - Uses cosine similarity for relevance
7. ✅ **Pinterest-Style UI** - Beautiful gradient design with animations

---

## 💬 AI CHATBOT EXAMPLE QUESTIONS

### **1. Service Discovery Questions**

#### Basic Service Queries:
- "I need a plumber"
- "Find me an electrician"
- "Looking for house cleaning services"
- "Show me AC repair services"
- "I want to hire a painter"

#### Category-Specific:
- "Best plumbing services in Kathmandu"
- "Professional electrical repair"
- "Deep cleaning for my office"
- "Solar panel installation"
- "Pest control services"

---

### **2. Budget-Based Questions**

#### With Price Limits:
- "Plumber under 2000 rupees"
- "Electrician within NPR 1500"
- "Cleaning service below 1000"
- "Cheap handyman services"
- "Affordable painting under 3000"

#### Budget Phrases Detected:
- "under 2000"
- "below 1500"
- "within NPR 3000"
- "less than 2500"
- "max 4000"
- "budget 1000"

---

### **3. Location-Based Questions**

#### Area-Specific:
- "Plumber in Tinkune"
- "Electrician near Baneshwor"
- "Cleaning service in Koteshwor"
- "Handyman around Chabahil"
- "Painter in Kalanki area"

#### Supported Areas (30+ Kathmandu localities):
- Tinkune, Baneshwor, Koteshwor, Chabahil
- Kalanki, Thamel, Boudha, Baluwatar
- Lazimpat, Jawalakhel, Sanepa, Balaju
- Maharajgunj, Swayambhu, Maitighar
- And 15+ more areas

---

### **4. Combined Questions (Most Powerful)**

#### Category + Budget:
- "Plumber under 2000 rupees"
- "Electrician within 1500"
- "Cleaning service below 1000"

#### Category + Location:
- "Plumber in Tinkune"
- "Electrician near Baneshwor"
- "Cleaning service in Koteshwor"

#### Category + Budget + Location:
- "Plumber in Tinkune under 2000"
- "Electrician near Baneshwor within 1500"
- "Cleaning service in Koteshwor below 1000"
- "Affordable painter in Kalanki under 3000"

---

### **5. Natural Language Questions**

#### Conversational Style:
- "I have a leaking pipe, can you help?"
- "My AC is not cooling properly"
- "Need someone to clean my house"
- "Looking for a good electrician nearby"
- "Who can fix my water tank?"

#### Problem-Based:
- "My electricity is not working"
- "Water leakage in bathroom"
- "Need to paint my house"
- "AC making strange noise"
- "Garden needs maintenance"

---

### **6. Specific Service Questions**

#### By Service Type:
- "Water tank cleaning"
- "Solar panel installation"
- "Security camera setup"
- "Carpentry work"
- "Moving and packing"
- "Spa and massage"
- "Laundry service"

---

## 🧠 AI ALGORITHMS USED IN CHATBOT

### **1. Category Detection Algorithm**
- **Purpose:** Identifies service category from user message
- **Method:** Keyword matching against predefined categories
- **Categories:** plumbing, electrical, cleaning, painting, handyman, etc.

### **2. Budget Detection Algorithm**
- **Purpose:** Extracts price ceiling from natural language
- **Patterns:** "under X", "below X", "within X", "max X", "budget X"
- **Output:** Numeric value in NPR

### **3. Area Detection Algorithm**
- **Purpose:** Identifies Kathmandu locality mentioned
- **Method:** Fuzzy matching against 30+ area names
- **Output:** Area object with coordinates

### **4. Cosine Similarity Search**
- **Purpose:** Ranks services by relevance to query
- **Method:** TF-IDF vectorization + cosine similarity
- **Factors:** Service name, description, category, tags

### **5. Distance-Based Sorting**
- **Purpose:** Prioritizes nearby services when area detected
- **Method:** Haversine distance calculation
- **Output:** Services sorted by proximity

---

## 📊 CHATBOT RESPONSE STRUCTURE

```javascript
{
  "reply": "Here's what I found for you: You mentioned plumbing, so I prioritized specialists in that category. All suggestions are within NPR 2000 budget. Showing services near Tinkune. Top pick: Home Plumbing Service (NPR 1,500).",
  "suggestions": [
    {
      "id": "hc1",
      "name": "Home Plumbing Service",
      "priceLabel": "NPR 1,500",
      "providerName": "Tinkune Plumbing Services",
      "distanceKm": 0.5
    },
    {
      "id": "svc123",
      "name": "Quick Plumbing Fix",
      "priceLabel": "NPR 1,800",
      "providerName": "Baneshwor Plumbers",
      "distanceKm": 2.3
    }
  ]
}
```

---

## 🎯 TESTING THE CHATBOT

### **Try These Questions:**

1. **Simple:** "I need a plumber"
2. **With Budget:** "Electrician under 2000"
3. **With Location:** "Cleaning service in Tinkune"
4. **Combined:** "Affordable plumber in Baneshwor under 1500"
5. **Natural:** "My AC is not working, need help"
6. **Specific:** "Solar panel installation near Swayambhu"

---

## 🔮 FUTURE ENHANCEMENTS

### **For Dijkstra's Algorithm:**
- Integrate with booking flow for delivery time estimation
- Add route visualization on map
- Multi-stop route optimization
- Real-time traffic consideration

### **For AI Chatbot:**
- Voice input support
- Image recognition for problem diagnosis
- Booking directly from chat
- Provider availability checking
- Price negotiation assistance
- Multi-language support (Nepali)

---

## 📝 SUMMARY

**Dijkstra's Algorithm:**
- ✅ Implemented and working
- ⚠️ Not currently used in frontend
- 🎯 Ready for route planning features

**AI Chatbot:**
- ✅ Fully functional with 5 AI algorithms
- ✅ Supports natural language queries
- ✅ Multi-query conversation tracking
- ✅ Beautiful Pinterest-style UI
- 🎯 Handles category, budget, and location detection
