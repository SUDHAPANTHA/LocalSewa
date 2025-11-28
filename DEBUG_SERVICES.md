# Debug Services Not Showing

## Quick Checks

### 1. Check if Backend is Running
```bash
# In backend folder
cd backend
npm start
```

**Expected output:**
```
Server running on port 5000
MongoDB connected
```

### 2. Test Backend API Directly

Open browser and go to:
```
http://localhost:5000/admin/services
```

**Expected response:**
```json
{
  "services": [
    {
      "_id": "...",
      "name": "Service Name",
      "description": "...",
      "price": 1500,
      "category": "plumbing",
      "provider": {
        "_id": "...",
        "name": "Provider Name",
        "email": "...",
        "phone": "...",
        "isApproved": true
      },
      "isApproved": null,
      "createdAt": "..."
    }
  ]
}
```

### 3. Check Frontend is Running
```bash
# In project folder
cd project
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

### 4. Check Browser Console

1. Open Admin Services page: `http://localhost:5173/#/admin/services`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Click "Debug Info" button
5. Look for:
   - `[AdminServices] Calling adminApi.getAllServices...`
   - `[AdminServices] Response received:`
   - `[AdminServices] Services array:`
   - `Total services: X`

### 5. Check Network Tab

1. Open DevTools → Network tab
2. Refresh Admin Services page
3. Look for request to: `http://localhost:5000/admin/services`
4. Check:
   - Status: Should be 200
   - Response: Should have `services` array
   - If 404: Route not found
   - If 500: Server error
   - If failed: Backend not running

## Common Issues & Solutions

### Issue 1: Backend Not Running
**Symptom:** Network error, "Failed to connect"
**Solution:**
```bash
cd backend
npm start
```

### Issue 2: Wrong Port
**Symptom:** Connection refused on port 3000
**Solution:** Backend runs on port 5000, not 3000
- Check `.env` file in backend folder
- Should have: `PORT=5000` (or no PORT, defaults to 5000)

### Issue 3: MongoDB Not Connected
**Symptom:** Backend starts but crashes
**Solution:**
- Check MongoDB is running
- Check `.env` has correct `MONGO_URI`

### Issue 4: No Services in Database
**Symptom:** Backend returns empty array `{ services: [] }`
**Solution:**
1. Create a service as vendor first
2. Or check MongoDB:
```javascript
// In MongoDB shell or Compass
db.services.find()
```

### Issue 5: CORS Error
**Symptom:** "CORS policy" error in console
**Solution:** Backend should have CORS enabled (already configured)

### Issue 6: Frontend Not Fetching
**Symptom:** No network request in DevTools
**Solution:**
- Check if you're logged in as admin
- Check browser console for errors
- Try clicking "Refresh" button

## Step-by-Step Debug Process

### Step 1: Verify Backend
```bash
# Terminal 1
cd backend
npm start

# Should see:
# Server running on port 5000
# MongoDB connected
```

### Step 2: Test API Manually
```bash
# Terminal 2 (or browser)
curl http://localhost:5000/admin/services

# Should return JSON with services array
```

### Step 3: Check Database
```bash
# MongoDB shell or Compass
use your_database_name
db.services.find().pretty()

# Should show services
```

### Step 4: Create Test Service
If no services exist:
1. Login as vendor
2. Go to "My Services"
3. Click "Add Service"
4. Fill form and submit
5. Check if it appears in vendor's list

### Step 5: Check Admin Panel
1. Login as admin
2. Go to "Manage Services"
3. Open DevTools Console
4. Click "Debug Info" button
5. Check console output

### Step 6: Check Network Request
1. DevTools → Network tab
2. Refresh page
3. Find `/admin/services` request
4. Check Status and Response

## Console Commands for Testing

### In Browser Console (Admin Services Page):

```javascript
// Check current state
console.log("Services:", services);
console.log("Filtered:", filteredServices);
console.log("Loading:", loading);

// Manually fetch
adminApi.getAllServices().then(resp => {
  console.log("Manual fetch result:", resp.data);
});

// Check API base URL
console.log("API Base:", import.meta.env.VITE_API_URL || "http://localhost:5000");
```

## Expected Flow

1. **Vendor creates service**
   - POST `/provider-add-service/:id`
   - Service saved with `isApproved: null`

2. **Admin fetches services**
   - GET `/admin/services`
   - Returns ALL services (pending, approved, rejected)

3. **Frontend displays**
   - AdminServices component fetches
   - Shows services with status badges
   - Filter buttons work

## If Still Not Working

### Check These Files:

1. **Backend Route** (`backend/index.js` line ~1317):
```javascript
app.get("/admin/services", async (req, res) => {
  try {
    const services = await Service.find()
      .populate("provider", "name email phone isApproved")
      .sort({ createdAt: -1 });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
```

2. **Frontend API** (`project/src/api/admin.ts`):
```typescript
getAllServices: (config?: RequestConfig) =>
  api.get<{ services: Service[] }>("/admin/services", {
    signal: config?.signal,
  }),
```

3. **Frontend Component** (`project/src/pages/admin/AdminServices.tsx`):
```typescript
const resp = await adminApi.getAllServices({
  signal: controller.signal,
});
setServices(resp.data.services || []);
```

## Contact Points

If services still not showing, check:
1. ✅ Backend running on port 5000
2. ✅ Frontend running on port 5173
3. ✅ MongoDB connected
4. ✅ At least one service exists in database
5. ✅ Logged in as admin
6. ✅ No console errors
7. ✅ Network request succeeds (200 status)
8. ✅ Response has `services` array

Click "Debug Info" button and share the console output!
