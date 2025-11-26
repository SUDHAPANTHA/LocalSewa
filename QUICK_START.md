# Local Sewa App - Quick Start Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

## Installation Steps

### 1. Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/localsewa
CORE_PROVIDER_EMAIL=system@sajilosewa.com
CORE_PROVIDER_PASSWORD=SecurePassword123!
CORE_PROVIDER_PHONE=9800000000
CORE_PROVIDER_ADDRESS=Kathmandu Valley
EOF

# Start the backend server
npm start
```

The backend will start on `http://localhost:5000`

### 2. Setup Frontend

```bash
# Open a new terminal
# Navigate to project directory
cd project

# Install dependencies
npm install

# Create .env file (if needed)
cat > .env << EOF
VITE_API_URL=http://localhost:5000
EOF

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## Default Accounts

### Admin Account
After first run, create an admin account:
```bash
curl -X POST http://localhost:5000/admin-register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@localsewa.com",
    "password": "Admin@123",
    "phone": "9800000001",
    "address": "Kathmandu"
  }'
```

### Vendor Account
Create a vendor account:
```bash
curl -X POST http://localhost:5000/provider-register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Vendor",
    "email": "vendor@test.com",
    "password": "Vendor@123",
    "phone": "9800000002",
    "address": "Tinkune, Kathmandu",
    "localAreaSlug": "tinkune"
  }'
```

### User Account
Create a user account:
```bash
curl -X POST http://localhost:5000/user-register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "user@test.com",
    "password": "User@123",
    "phone": "9800000003",
    "address": "Kathmandu"
  }'
```

## Testing the Application

### 1. Test User Flow

1. Open browser and go to `http://localhost:5173`
2. Click "Login" and use user credentials
3. Navigate to "Services" page
4. You should see 15 hardcoded services
5. Use the search bar to filter services
6. Click "Book Now" on any service
7. Select date/time and confirm booking

### 2. Test Vendor Flow

1. Login with vendor credentials
2. Navigate to "My Services"
3. Click "Add Service" button
4. Fill in the form:
   - Name: "Professional Plumbing"
   - Description: "Expert plumbing services for homes and offices"
   - Price: 1500
   - Category: plumbing
5. Submit the form
6. Service will show "Pending" status
7. After admin approval, it will appear in user marketplace

### 3. Test Admin Flow

1. Login with admin credentials
2. Navigate to admin dashboard
3. Go to "Services" section
4. Find the pending vendor service
5. Click "Approve" to make it visible to users
6. Verify it appears in user marketplace

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify MONGODB_URI in .env file
- Check if port 5000 is available

### Frontend won't start
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if port 5173 is available
- Verify VITE_API_URL in .env file

### Services not showing
- Check browser console for errors
- Verify backend is running
- Check MongoDB connection
- Ensure services are approved by admin

### Can't create bookings
- Verify user is logged in
- Check if service provider is approved
- Ensure date/time is in the future

## API Testing with Postman

Import these endpoints into Postman:

### Get All Services
```
GET http://localhost:5000/services
```

### Add Service (Vendor)
```
POST http://localhost:5000/provider-add-service/:providerId
Content-Type: application/json

{
  "name": "Test Service",
  "description": "Test description",
  "price": 1000,
  "category": "plumbing"
}
```

### Create Booking
```
POST http://localhost:5000/create-booking
Content-Type: application/json

{
  "user": "USER_ID",
  "provider": "PROVIDER_ID",
  "service": "SERVICE_ID",
  "bookingDate": "2025-12-31",
  "bookingTime": "14:00"
}
```

## Database Structure

The app will automatically create these collections:
- `users` - User accounts
- `serviceproviders` - Vendor accounts
- `admins` - Admin accounts
- `services` - All services
- `bookings` - Service bookings
- `reviews` - Service reviews
- `complaints` - User complaints
- `conversations` - Chatbot conversations
- `messages` - Chat messages

## Features to Test

### User Features:
- ✅ Browse services (15 hardcoded + approved vendor services)
- ✅ Search services by name/description/category
- ✅ Book services with date/time
- ✅ View booking history
- ✅ Submit reviews and ratings
- ✅ File complaints
- ✅ Use AI chatbot for service recommendations

### Vendor Features:
- ✅ Upload CV for approval
- ✅ Add new services
- ✅ View services in table format
- ✅ Edit service details
- ✅ Delete services
- ✅ View bookings
- ✅ Approve/reject bookings

### Admin Features:
- ✅ View all services
- ✅ Approve/reject vendor services
- ✅ Edit service details
- ✅ Delete services
- ✅ Manage users and vendors
- ✅ View all bookings
- ✅ Manage complaints
- ✅ Moderate reviews

## Next Steps

1. Test all three modules (Admin, Vendor, User)
2. Verify the location map functionality
3. Test the AI chatbot
4. Check the recommendation engine
5. Test booking flow end-to-end
6. Verify CV upload and approval process

## Support

If you encounter issues:
1. Check the console logs (both frontend and backend)
2. Verify MongoDB connection
3. Ensure all environment variables are set
4. Clear browser cache
5. Restart both servers

## Production Deployment

For production deployment:
1. Set up MongoDB Atlas or production MongoDB
2. Update environment variables
3. Build frontend: `npm run build`
4. Deploy backend to your server
5. Deploy frontend build to hosting service
6. Configure CORS and security settings

Enjoy using Local Sewa App! 🚀
