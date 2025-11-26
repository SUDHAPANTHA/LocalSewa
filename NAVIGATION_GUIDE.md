# 🧭 Navigation Guide - Local Sewa App

## Quick Access URLs

### User Pages
```
Services Page:        http://localhost:5173/#/user/services
My Bookings:          http://localhost:5173/#/user/bookings
My Dashboard:         http://localhost:5173/#/user/dashboard
```

### Vendor Pages
```
My Services:          http://localhost:5173/#/vendor/services
My Bookings:          http://localhost:5173/#/vendor/bookings
Vendor Dashboard:     http://localhost:5173/#/vendor/dashboard
```

### Admin Pages
```
Admin Dashboard:      http://localhost:5173/#/admin/dashboard
Manage Services:      http://localhost:5173/#/admin/services
Manage Providers:     http://localhost:5173/#/admin/providers
Manage Users:         http://localhost:5173/#/admin/users
Manage Bookings:      http://localhost:5173/#/admin/bookings
```

### Auth Pages
```
Login:                http://localhost:5173/#/login
Register:             http://localhost:5173/#/register
Home:                 http://localhost:5173/
```

## Complete User Flow

### 1. User Registration & Login
```
1. Go to: http://localhost:5173/#/register
2. Select "User" role
3. Fill in details:
   - Name: Test User
   - Email: user@test.com
   - Password: User@123
4. Click "Register"
5. Login at: http://localhost:5173/#/login
```

### 2. Browse & Book Services
```
1. Go to: http://localhost:5173/#/user/services
2. Browse 15 hardcoded + vendor services
3. Use search bar to filter
4. Click "Book Now" on vendor service
5. Select date/time
6. Click "Confirm Booking"
7. Note confirmation code
```

### 3. Manage Bookings
```
1. Go to: http://localhost:5173/#/user/bookings
2. See all your bookings
3. Click "Edit" to change date/time
4. Click "Cancel" to cancel booking
5. Click "Rate this service" for completed bookings
```

## Complete Vendor Flow

### 1. Vendor Registration & Login
```
1. Go to: http://localhost:5173/#/register
2. Select "Vendor" role
3. Fill in details:
   - Name: Test Vendor
   - Email: vendor@test.com
   - Password: Vendor@123
   - Area: Select from dropdown (e.g., Tinkune)
4. Click "Register"
5. Login at: http://localhost:5173/#/login
```

### 2. Get Approved (Required for bookings)
```
Option A - MongoDB (Quick):
mongosh
use localsewa
db.serviceproviders.updateOne(
  { email: "vendor@test.com" },
  { $set: { isApproved: true } }
)

Option B - Admin Dashboard:
1. Login as admin
2. Go to Providers section
3. Find vendor
4. Click "Approve"
```

### 3. Add Services
```
1. Go to: http://localhost:5173/#/vendor/services
2. Click "Add Service"
3. Fill in form:
   - Name: Professional Plumbing
   - Description: Expert plumbing services
   - Price: 1500
   - Category: plumbing
4. Click "Add Service"
5. Service appears in table
```

### 4. Manage Bookings
```
1. Go to: http://localhost:5173/#/vendor/bookings
2. See all bookings for your services
3. Click "Approve" to accept booking
4. Click "Reject" to decline booking
```

## Complete Admin Flow

### 1. Admin Registration & Login
```
1. Go to: http://localhost:5173/#/register
2. Select "Admin" role
3. Fill in details:
   - Name: Admin User
   - Email: admin@test.com
   - Password: Admin@123
4. Click "Register"
5. Login at: http://localhost:5173/#/login
```

### 2. Manage Vendors
```
1. Go to: http://localhost:5173/#/admin/providers
2. See all vendors
3. Click "Approve" to approve vendor
4. Click "Reject" to reject vendor
5. View CV scores if uploaded
```

### 3. Manage Services
```
1. Go to: http://localhost:5173/#/admin/services
2. See all services (hardcoded + vendor)
3. Click "Edit" to modify service
4. Click "Delete" to remove service
5. Approve/reject vendor services
```

### 4. Manage Bookings
```
1. Go to: http://localhost:5173/#/admin/bookings
2. See all bookings system-wide
3. Filter by status
4. Approve/reject bookings
5. View statistics
```

## App Structure

```
Local Sewa App
│
├── Home Page (/)
│   ├── Login
│   └── Register
│
├── User Module
│   ├── Services (Browse & Book)
│   ├── My Bookings (View/Edit/Cancel)
│   └── Dashboard (Overview)
│
├── Vendor Module
│   ├── My Services (Add/Edit/Delete)
│   ├── My Bookings (Approve/Reject)
│   └── Dashboard (Stats)
│
└── Admin Module
    ├── Dashboard (Overview)
    ├── Manage Services
    ├── Manage Vendors
    ├── Manage Users
    └── Manage Bookings
```

## Quick Test Scenario

### Complete End-to-End Test

```bash
# 1. Setup (One time)
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
exit

# 2. Start servers
# Terminal 1: cd backend && npm start
# Terminal 2: cd project && npm run dev
```

### Test as User
```
1. Register/Login as user
2. Go to Services: http://localhost:5173/#/user/services
3. Click "Book Now" on any vendor service
4. Select tomorrow's date, 2:00 PM
5. Confirm booking
6. Go to My Bookings: http://localhost:5173/#/user/bookings
7. Verify booking appears
```

### Test as Vendor
```
1. Login as vendor
2. Go to My Bookings: http://localhost:5173/#/vendor/bookings
3. See the booking from user
4. Click "Approve"
5. Verify status changes to "Confirmed"
```

### Test as Admin
```
1. Login as admin
2. Go to Bookings: http://localhost:5173/#/admin/bookings
3. See all bookings
4. Approve the booking
5. Verify status changes to "Scheduled"
```

## Keyboard Shortcuts

### Browser
```
Ctrl + Shift + R    Hard refresh (clear cache)
F12                 Open DevTools
Ctrl + Shift + I    Open DevTools
Ctrl + Shift + C    Inspect element
```

### Navigation
```
Alt + ←             Back
Alt + →             Forward
Ctrl + L            Focus address bar
Ctrl + T            New tab
```

## Troubleshooting Navigation

### Issue: Page not loading
```
1. Check URL is correct
2. Check servers are running
3. Check browser console for errors
4. Try hard refresh (Ctrl + Shift + R)
```

### Issue: "Not authorized" error
```
1. Check you're logged in
2. Check you have correct role
3. Try logging out and back in
4. Clear browser cache
```

### Issue: 404 Not Found
```
1. Check URL has # before route
   ✅ Correct: http://localhost:5173/#/user/services
   ❌ Wrong: http://localhost:5173/user/services
2. Check route exists in App.tsx
3. Check servers are running
```

## Mobile Navigation

### Responsive Design
All pages work on mobile devices:
- Hamburger menu for navigation
- Touch-friendly buttons
- Responsive tables
- Mobile-optimized forms

### Test on Mobile
```
1. Open DevTools (F12)
2. Click device toolbar icon
3. Select device (iPhone, iPad, etc.)
4. Test navigation and features
```

## Browser Compatibility

### Supported Browsers
- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ⚠️ IE11 (Limited support)

### Recommended
```
Chrome Version 90+
Firefox Version 88+
Edge Version 90+
Safari Version 14+
```

## Development URLs

### Backend API
```
Base URL:             http://localhost:5000
API Docs:             http://localhost:5000/api-docs (if available)
Health Check:         http://localhost:5000/health (if available)
```

### Frontend
```
Dev Server:           http://localhost:5173
Build Output:         dist/
```

### Database
```
MongoDB:              mongodb://localhost:27017/localsewa
MongoDB Compass:      mongodb://localhost:27017
```

## Quick Links Reference

### Most Used Pages
```
📋 Services:          /#/user/services
📅 My Bookings:       /#/user/bookings
🏪 Vendor Services:   /#/vendor/services
📊 Admin Dashboard:   /#/admin/dashboard
```

### Account Pages
```
🔐 Login:             /#/login
📝 Register:          /#/register
👤 Profile:           /#/profile (if available)
⚙️ Settings:          /#/settings (if available)
```

---

## 🎯 Quick Start Navigation

### For Users:
```
1. Register → Login → Services → Book → My Bookings
```

### For Vendors:
```
1. Register → Get Approved → Add Services → View Bookings → Approve
```

### For Admin:
```
1. Register → Login → Dashboard → Manage Everything
```

---

**Status**: ✅ COMPLETE NAVIGATION GUIDE
**Date**: December 2024

**Sabai pages ko URLs ready cha! Navigate garnus! 🚀**
