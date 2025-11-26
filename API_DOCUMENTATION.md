# Local Sewa App - API Documentation

## Overview
Local Sewa is a comprehensive service marketplace platform with three main modules: Admin, Vendor (Service Provider), and User. The system includes AI-powered chatbot, location-based search, and cosine similarity recommendation engine.

## Base URL
```
http://localhost:5000
```

## Features
- ✅ Multi-role authentication (Admin, Vendor, User)
- ✅ CV upload and AI evaluation for vendors
- ✅ Service management with location tagging
- ✅ Booking system with approval workflows
- ✅ Reviews and ratings
- ✅ Complaints management
- ✅ AI Chatbot with multi-chat support
- ✅ Cosine similarity-based recommendations
- ✅ Location-based nearest service search
- ✅ Real-time updates via WebSocket

---

## Authentication Endpoints

### User Registration
```http
POST /user-register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9841234567",
  "address": "Kathmandu"
}
```

### Vendor Registration
```http
POST /provider-register
Content-Type: application/json

{
  "name": "Ram Electrician",
  "email": "ram@example.com",
  "password": "password123",
  "phone": "9841234567",
  "address": "Tinkune, Kathmandu",
  "localAreaSlug": "tinkune"
}
```

### Admin Registration
```http
POST /admin-register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@localsewa.com",
  "password": "admin123"
}
```

### Login Endpoints
```http
POST /user-login
POST /provider-login
POST /admin-login

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## Admin Module

### Get All Providers
```http
GET /admin-get-providers?cvStatus=pending&approved=false&search=ram
```

### Get All Users
```http
GET /admin-get-users
```

### Delete User
```http
DELETE /admin-delete-user/:id
```

### Get All Bookings
```http
GET /admin-get-all-bookings
```

### Approve/Reject Booking
```http
PATCH /admin-approve-booking/:id
Content-Type: application/json

{
  "isAdminApproved": true
}
```

### Approve/Reject Provider
```http
PATCH /admin-approve-provider/:id
Content-Type: application/json

{
  "isApproved": true,
  "cvStatus": "approved",
  "reviewerNote": "Excellent qualifications",
  "reviewer": "admin@localsewa.com"
}
```

### Get All Services
```http
GET /admin/services
```

### Edit Service
```http
PATCH /admin/service/:id
Content-Type: application/json

{
  "name": "Updated Service Name",
  "description": "Updated description",
  "price": 2500,
  "category": "plumbing",
  "rating": 4.5
}
```

### Delete Service
```http
DELETE /admin/service/:id
```

### Get All Complaints
```http
GET /admin/complaints?status=open&priority=high
```

### Get All Reviews
```http
GET /admin/reviews?status=published&minRating=4
```

### Update Review Status
```http
PATCH /admin/review/:id
Content-Type: application/json

{
  "status": "hidden"
}
```

### Get Dashboard Stats
```http
GET /admin/stats
```

---

## Vendor Module

### Upload CV
```http
POST /provider/:id/upload-cv
Content-Type: multipart/form-data

cv: [PDF file]
```

### Update Location
```http
PATCH /provider/:id/location
Content-Type: application/json

{
  "lat": 27.7172,
  "lng": 85.3240,
  "locality": "Tinkune",
  "formattedAddress": "Tinkune, Kathmandu",
  "serviceRadiusKm": 10
}
```

### Add Service
```http
POST /provider-add-service/:id
Content-Type: application/json

{
  "name": "Emergency Plumbing",
  "description": "24/7 plumbing service",
  "price": 1500,
  "category": "plumbing",
  "emojiIcon": "🚰",
  "tags": ["emergency", "24/7"],
  "areaTags": ["tinkune", "koteshwor"]
}
```

### Get Provider Details
```http
GET /provider/:id
```

### Get Provider Services
```http
GET /provider-services/:id
```

### Get Provider Bookings
```http
GET /provider-bookings/:providerId
```

### Update Service
```http
PUT /provider-update-service/:serviceId
Content-Type: application/json

{
  "name": "Updated Service",
  "price": 2000,
  "description": "Updated description"
}
```

### Delete Service
```http
DELETE /provider-delete-service/:providerId/:serviceId
```

### Approve/Reject Booking
```http
PATCH /provider-approve-booking/:id
Content-Type: application/json

{
  "isProviderApproved": true
}
```

### Get Provider Complaints
```http
GET /complaints/provider/:providerId
```

---

## User Module

### Search Services
```http
GET /services?search=plumber&category=plumbing&minPrice=1000&maxPrice=3000&area=tinkune&onlyReviewed=true&cvQualified=true
```

### Get Nearest Services
```http
GET /services/nearest?lat=27.7172&lng=85.3240&category=plumbing&radiusKm=5&cvQualified=true
```

### Get Pinned/Core Services
```http
GET /services/pinned
```

### Get Service Details
```http
GET /services/:id
```

### Get Recommended Services
```http
GET /services/recommended/:userId
```

### Smart Search (Cosine Similarity)
```http
GET /services/search/smart?q=need plumber in tinkune under 2000&limit=10&cvQualified=true
```

### Get Services by Area
```http
GET /areas/:slug/services?radiusKm=5&category=plumbing&cvQualified=true
```

### Create Booking
```http
POST /create-booking
Content-Type: application/json

{
  "user": "userId",
  "provider": "providerId",
  "service": "serviceId",
  "bookingDate": "2025-12-01",
  "bookingTime": "14:30",
  "userAreaSlug": "tinkune",
  "latitude": 27.7172,
  "longitude": 85.3240
}
```

### Get User Bookings
```http
GET /get-user-bookings/:userId
```

### Update Booking
```http
PATCH /user-update-booking/:id
Content-Type: application/json

{
  "bookingDate": "2025-12-02",
  "bookingTime": "15:00"
}
```

### Cancel Booking
```http
DELETE /user-cancel-booking/:id
```

### Update Booking Status
```http
PATCH /bookings/:id/status
Content-Type: application/json

{
  "status": "completed",
  "note": "Service completed successfully",
  "actor": "userId"
}
```

---

## Reviews & Ratings

### Get Service Reviews
```http
GET /services/:serviceId/reviews?page=1&limit=10&status=published
```

### Submit Review
```http
POST /services/:serviceId/reviews
Content-Type: application/json

{
  "userId": "userId",
  "bookingId": "bookingId",
  "rating": 5,
  "title": "Excellent Service",
  "comment": "Very professional and timely"
}
```

### Update Review
```http
PATCH /reviews/:id
Content-Type: application/json

{
  "userId": "userId",
  "rating": 4,
  "comment": "Updated review"
}
```

### Delete Review
```http
DELETE /reviews/:id?userId=userId
```

---

## Complaints

### Submit Complaint
```http
POST /complaints
Content-Type: application/json

{
  "userId": "userId",
  "bookingId": "bookingId",
  "title": "Service not completed",
  "category": "quality",
  "description": "The plumber did not fix the leak properly",
  "priority": "high"
}
```

### Get User Complaints
```http
GET /complaints/user/:userId
```

### Update Complaint
```http
PATCH /complaints/:id
Content-Type: application/json

{
  "status": "resolved",
  "note": "Issue resolved with refund",
  "actor": "admin",
  "resolution": {
    "summary": "Full refund provided",
    "refundAmount": 1500
  }
}
```

---

## AI Chatbot (Multi-Chat Support)

### Create Conversation
```http
POST /conversations
Content-Type: application/json

{
  "userId": "userId",
  "title": "Finding Plumber"
}
```

### Get User Conversations
```http
GET /conversations/user/:userId
```

### Get Conversation Details
```http
GET /conversations/:id
```

### Send Message
```http
POST /conversations/:id/messages
Content-Type: application/json

{
  "userId": "userId",
  "message": "I need a plumber in Tinkune under NPR 2000"
}

Response:
{
  "success": true,
  "reply": "Here's what I found for you: You mentioned plumbing...",
  "suggestions": [
    {
      "serviceId": "...",
      "name": "Emergency Plumbing",
      "price": 1500,
      "priceLabel": "NPR 1,500",
      "providerName": "Ram Plumber",
      "distanceKm": 2.5
    }
  ],
  "conversation": {...}
}
```

### Delete Conversation
```http
DELETE /conversations/:id
```

### Legacy Chatbot (Single Message)
```http
POST /chatbot
Content-Type: application/json

{
  "message": "need electrician in koteshwor"
}
```

---

## Location & Areas

### Get All Areas
```http
GET /areas
```

### Calculate Shortest Route
```http
POST /routes/shortest
Content-Type: application/json

{
  "from": "tinkune",
  "to": "koteshwor"
}
```

---

## Real-time Updates

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data.payload);
};

// Subscribe to area updates
ws.send(JSON.stringify({
  type: 'subscribe',
  scope: 'areas'
}));
```

### Server-Sent Events (SSE)
```javascript
const eventSource = new EventSource('http://localhost:5000/service-stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Service update:', data);
};
```

---

## Data Models

### Service Categories
- plumbing
- electrical
- cleaning
- appliance
- painting
- moving
- handyman
- gardening
- security
- wellness

### Booking Status
- pending
- confirmed
- scheduled
- completed
- cancelled

### Complaint Status
- open
- in_review
- needs_info
- escalated
- resolved
- closed

### Review Status
- draft
- published
- hidden

---

## Key Features Explained

### 1. CV Evaluation System
Vendors upload PDF CVs which are automatically analyzed for:
- Skill keywords matching service categories
- Years of experience
- Certifications
- Management experience
- Risk flags
- CV score (0-1) used for provider ranking

### 2. Cosine Similarity Search
Smart search uses vector-based cosine similarity to match user queries with services based on:
- Service name and description
- Category and tags
- Provider skills
- Location area tags

### 3. Location-Based Search
- Haversine distance calculation
- Geospatial queries using MongoDB 2dsphere indexes
- Service radius filtering
- Nearest provider suggestions

### 4. Recommendation Engine
Personalized recommendations based on:
- User booking history (30%)
- Service popularity (25%)
- Category preferences (25%)
- Recency (10%)
- Provider quality score (10%)

### 5. Smart Score
Provider ranking based on:
- CV score (60%)
- Booking count (30%)
- Preference boost (10%)

---

## Error Handling

All endpoints return consistent error responses:
```json
{
  "msg": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad request / Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 409: Conflict (e.g., booking slot taken)
- 500: Server error

---

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/localsewa
CORE_PROVIDER_EMAIL=system@sajilosewa.com
CORE_PROVIDER_PASSWORD=strong-password
CORE_PROVIDER_PHONE=9800000000
```

---

## Testing the API

### Using cURL
```bash
# Register user
curl -X POST http://localhost:5000/user-register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Search services
curl "http://localhost:5000/services?category=plumbing&area=tinkune"

# Smart search
curl "http://localhost:5000/services/search/smart?q=plumber+in+tinkune"
```

### Using Postman
Import the endpoints and test with the provided JSON payloads.

---

## Notes

1. **CV Upload**: Only PDF files up to 8MB are accepted
2. **Booking Time**: Use 24-hour format (HH:MM) and YYYY-MM-DD for dates
3. **Location**: Coordinates should be [longitude, latitude] for MongoDB
4. **Price**: All prices are in NPR (Nepali Rupees)
5. **Approval Flow**: Vendor → Provider Approval → Admin Approval → Scheduled
6. **Review Uniqueness**: One review per user per service
7. **Booking Uniqueness**: One booking per provider per time slot

---

## Support

For issues or questions, contact the development team.
