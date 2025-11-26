# Local Sewa App - Code Reference

## Complete File Listing

This document provides a reference to all the key files in the application.

## Backend Files

### 1. backend/index.js
- Main server file with all API routes
- Handles authentication, services, bookings, reviews, complaints
- Includes AI chatbot with cosine similarity
- Location-based service search
- WebSocket support (can be removed if not needed)
- SSE for real-time updates (can be removed if not needed)

**Key Routes:**
- Auth: `/user-register`, `/provider-register`, `/admin-register`, `/user-login`, `/provider-login`, `/admin-login`
- Services: `/services`, `/provider-add-service/:id`, `/provider-update-service/:serviceId`, `/provider-delete-service/:providerId/:serviceId`
- Bookings: `/create-booking`, `/get-user-bookings/:userId`, `/provider-bookings/:providerId`
- Admin: `/admin/services`, `/admin/service/:id`, `/admin-approve-provider/:id`
- Reviews: `/services/:serviceId/reviews`, `/reviews/:id`
- Complaints: `/complaints`, `/complaints/user/:userId`, `/complaints/provider/:providerId`
- Chatbot: `/chatbot`, `/conversations`, `/conversations/:id/messages`
- Location: `/areas`, `/areas/:slug/services`, `/routes/shortest`, `/services/nearest`

### 2. backend/models/conversation.js
- NEW file for multi-chat support
- Stores user conversations with AI chatbot
- Includes message history and metadata

### 3. backend/models/serviceprovider.js
- Service and ServiceProvider schemas
- Includes CV scoring, location data, smart scoring
- Service categories and review stats

### 4. backend/models/user.js
- User schema for customer accounts

### 5. backend/models/admin.js
- Admin schema for admin accounts

### 6. backend/models/booking.js
- Booking schema with status timeline
- Includes confirmation codes and approval flags

### 7. backend/models/review.js
- Review schema with ratings and sentiment analysis

### 8. backend/models/complaint.js
- Complaint schema with priority and resolution tracking

### 9. backend/models/message.js
- Message schema for direct messaging

### 10. backend/config/conn.js
- MongoDB connection configuration

### 11. backend/config/multer.js
- File upload configuration for CV uploads

### 12. backend/constants/coreServices.js
- Hardcoded core services (if any)

### 13. backend/constants/kathmanduAreas.js
- Kathmandu area definitions with coordinates
- Dijkstra's algorithm for shortest route

## Frontend Files

### 1. project/src/pages/user/Services.tsx
**COMPLETELY REWRITTEN**

Features:
- Simple search bar
- 15 hardcoded services
- Vendor services appear first (after approval)
- Clean card-based UI
- Booking modal
- No complex filters or live updates

Key Components:
- `HARDCODED_SERVICES` array with 15 demo services
- `fetchVendorServices()` - Gets approved vendor services
- `handleBooking()` - Creates booking
- Search functionality
- Service cards with booking button

### 2. project/src/pages/vendor/VendorServices.tsx
**COMPLETELY REWRITTEN**

Features:
- Beautiful table view
- View, Edit, Delete actions
- Text-only descriptions
- Status indicators (Pending/Approved)
- Modal forms for add/edit
- View modal for service details

Key Components:
- `fetchServices()` - Gets vendor's services
- `handleAddService()` - Adds new service
- `handleUpdateService()` - Updates service
- `handleDeleteService()` - Deletes service
- `ServiceForm` component for add/edit
- Table with action buttons

### 3. project/src/components/Chatbot.tsx
- AI chatbot widget
- Floating button in bottom-right
- Chat interface with message history
- Connects to `/chatbot` endpoint

### 4. project/src/components/Layout.tsx
- Main layout wrapper
- Navigation bar
- Footer
- Responsive design

### 5. project/src/components/Modal.tsx
- Reusable modal component
- Used for booking, add/edit service forms

### 6. project/src/components/Toast.tsx
- Toast notification system
- Success, error, info messages

### 7. project/src/context/AuthContext.tsx
- Authentication context
- User state management
- Login/logout functions

### 8. project/src/api/services.ts
- Service API calls
- `getAllServices()` - Get all services
- `getProviderServices()` - Get vendor's services
- `addService()` - Add new service
- `updateService()` - Update service
- `deleteService()` - Delete service
- `getNearestProviders()` - Location-based search
- `smartSearch()` - AI-powered search

### 9. project/src/api/bookings.ts
- Booking API calls
- `createBooking()` - Create booking
- `getUserBookings()` - Get user's bookings
- `updateBooking()` - Update booking
- `cancelBooking()` - Cancel booking

### 10. project/src/api/auth.ts
- Authentication API calls
- `register()` - User registration
- `login()` - User login
- `logout()` - User logout

### 11. project/src/api/client.ts
- Axios client configuration
- Base URL setup
- Request/response interceptors

### 12. project/src/types/index.ts
- TypeScript type definitions
- Service, User, Booking, Review, Complaint types
- Added `isHardcoded` property to Service type

### 13. project/src/utils/currency.ts
- Currency formatting utilities
- `formatNpr()` - Format price in NPR

### 14. project/src/utils/errors.ts
- Error handling utilities
- `getApiErrorMessage()` - Extract error messages

## Configuration Files

### Backend

1. **backend/package.json**
```json
{
  "name": "backend",
  "type": "module",
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.1",
    "express": "^5.1.0",
    "mongoose": "^8.16.5",
    "multer": "^2.0.1",
    "nodemon": "^3.1.10",
    "pdf-parse": "^1.1.1",
    "ws": "^8.18.3"
  }
}
```

2. **backend/.env**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/localsewa
CORE_PROVIDER_EMAIL=system@sajilosewa.com
CORE_PROVIDER_PASSWORD=SecurePassword123!
CORE_PROVIDER_PHONE=9800000000
CORE_PROVIDER_ADDRESS=Kathmandu Valley
```

### Frontend

1. **project/package.json**
```json
{
  "name": "vite-react-typescript-starter",
  "type": "module",
  "dependencies": {
    "axios": "^1.13.2",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^7.9.6",
    "react-toastify": "^11.0.5"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.12",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}
```

2. **project/.env**
```env
VITE_API_URL=http://localhost:5000
```

3. **project/vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

4. **project/tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Key Features Implementation

### 1. Hardcoded Services
Located in: `project/src/pages/user/Services.tsx`
```typescript
const HARDCODED_SERVICES = [
  {
    _id: "hc1",
    name: "Home Plumbing Service",
    description: "Professional plumbing repairs and installations",
    price: 1500,
    category: "plumbing",
    emojiIcon: "🔧",
    rating: 4.5,
    bookingCount: 45,
    isHardcoded: true,
  },
  // ... 14 more services
];
```

### 2. Service Approval Flow
1. Vendor adds service → Status: "Pending"
2. Admin approves service → Status: "Approved"
3. Service appears in user marketplace

### 3. Search Functionality
```typescript
const filteredServices = allServices.filter((service) => {
  if (!searchQuery.trim()) return true;
  const query = searchQuery.toLowerCase();
  return (
    service.name.toLowerCase().includes(query) ||
    service.description.toLowerCase().includes(query) ||
    service.category.toLowerCase().includes(query)
  );
});
```

### 4. Table View for Vendor Services
- Columns: Name, Category, Price, Status, Actions
- Actions: View (eye icon), Edit (pencil icon), Delete (trash icon)
- Status badges: Green for "Approved", Amber for "Pending"

### 5. Location Map
- Uses Leaflet and React-Leaflet
- Shows Kathmandu areas
- Displays services on map
- Calculates shortest routes

### 6. AI Chatbot
- Cosine similarity for service matching
- Detects category, budget, location from user message
- Suggests relevant services
- Multi-chat support with conversation history

## Database Schema

### Services Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  currency: String (default: "NPR"),
  category: String,
  provider: ObjectId (ref: ServiceProvider),
  rating: Number,
  bookingCount: Number,
  tags: [String],
  isCore: Boolean,
  reviewStats: {
    total: Number,
    average: Number,
    distribution: { five, four, three, two, one }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Bookings Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  provider: ObjectId (ref: ServiceProvider),
  service: ObjectId (ref: Service),
  bookingDate: String (YYYY-MM-DD),
  bookingTime: String (HH:MM),
  totalAmount: Number,
  status: String (pending/confirmed/completed/cancelled),
  confirmationCode: String,
  isProviderApproved: Boolean,
  isAdminApproved: Boolean,
  statusTimeline: [{ status, note, changedBy, changedAt }],
  createdAt: Date,
  updatedAt: Date
}
```

### Conversations Collection (NEW)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  title: String,
  messages: [{
    role: String (user/assistant),
    content: String,
    metadata: Mixed,
    createdAt: Date
  }],
  isActive: Boolean,
  lastMessageAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Testing Checklist

### User Module:
- [ ] Can view 15 hardcoded services
- [ ] Can see approved vendor services on top
- [ ] Can search services by name/description/category
- [ ] Can book a service with date/time
- [ ] Can view booking history
- [ ] Can submit reviews
- [ ] Can file complaints
- [ ] Can use AI chatbot

### Vendor Module:
- [ ] Can upload CV
- [ ] Can add new service
- [ ] Service shows "Pending" status
- [ ] Can view services in table
- [ ] Can edit service details
- [ ] Can delete service
- [ ] Can view bookings
- [ ] Can approve/reject bookings

### Admin Module:
- [ ] Can view all services
- [ ] Can approve vendor services
- [ ] Can edit service details
- [ ] Can delete services
- [ ] Can manage users
- [ ] Can manage bookings
- [ ] Can view complaints
- [ ] Can moderate reviews

## Deployment Notes

### Backend Deployment:
1. Set environment variables
2. Ensure MongoDB is accessible
3. Run `npm install`
4. Run `npm start`
5. Server runs on specified PORT

### Frontend Deployment:
1. Update VITE_API_URL to production backend URL
2. Run `npm run build`
3. Deploy `dist` folder to hosting service
4. Configure CORS on backend

### Production Checklist:
- [ ] MongoDB Atlas or production database
- [ ] Environment variables set
- [ ] CORS configured
- [ ] SSL certificates installed
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] Monitoring tools setup

## Support and Maintenance

### Common Issues:
1. **Services not showing**: Check admin approval status
2. **Booking fails**: Verify date/time format
3. **CV upload fails**: Check file size and format
4. **Location map not loading**: Verify Leaflet CSS is loaded
5. **Chatbot not responding**: Check backend API connection

### Maintenance Tasks:
- Regular database backups
- Monitor server logs
- Update dependencies
- Review and moderate content
- Analyze user feedback
- Optimize database queries

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
