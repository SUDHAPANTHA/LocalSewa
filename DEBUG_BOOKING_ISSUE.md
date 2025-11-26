# 🔍 Debug Booking Issue

## Problem
"Booking failed" error when trying to book a service.

## Common Causes & Solutions

### 1. Provider Not Approved ⚠️
**Error:** "Provider is not approved. Service not available."

**Solution:**
```bash
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
exit
```

### 2. User Not Logged In
**Error:** "Please log in to book a service"

**Solution:**
- Make sure you're logged in
- Check browser console for user object
- Try logging out and back in

### 3. Invalid Date/Time
**Error:** "Invalid bookingDate format" or "Invalid bookingTime format"

**Solution:**
- Select a future date
- Make sure time is selected
- Format should be: YYYY-MM-DD HH:MM

### 4. Missing Provider ID
**Error:** "Provider unavailable for this service"

**Solution:**
- This means the service doesn't have a provider
- Check if service is properly created
- Verify provider field exists

### 5. Past Date Selected
**Error:** "Cannot book for past date/time"

**Solution:**
- Select tomorrow or later
- Make sure time is in the future

## Debug Steps

### Step 1: Check Browser Console
```
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try booking again
4. Look for these logs:
   - "Booking data: {...}"
   - "Booking response: {...}"
   - "Booking error: {...}"
```

### Step 2: Check Network Tab
```
1. Open DevTools (F12)
2. Go to Network tab
3. Try booking again
4. Find "create-booking" request
5. Check:
   - Request payload
   - Response status
   - Response data
```

### Step 3: Check Backend Logs
```
Look in backend terminal for:
- [API] POST /create-booking -> XXX
- Any error messages
- Validation failures
```

### Step 4: Verify Data
```bash
# Check if user exists
mongosh
use localsewa
db.users.findOne({ email: "user@test.com" })

# Check if provider exists and is approved
db.serviceproviders.findOne(
  { _id: ObjectId("PROVIDER_ID") },
  { name: 1, isApproved: 1 }
)

# Check if service exists
db.services.findOne(
  { _id: ObjectId("SERVICE_ID") },
  { name: 1, provider: 1 }
)
```

## Quick Fix Commands

### Fix 1: Approve All Vendors
```bash
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
```

### Fix 2: Check User Session
```javascript
// In browser console
console.log(localStorage.getItem('user'))
// Should show user data
```

### Fix 3: Test API Directly
```bash
# Replace IDs with actual values
curl -X POST http://localhost:5000/create-booking \
  -H "Content-Type: application/json" \
  -d '{
    "user": "USER_ID_HERE",
    "provider": "PROVIDER_ID_HERE",
    "service": "SERVICE_ID_HERE",
    "bookingDate": "2025-12-31",
    "bookingTime": "14:00"
  }'
```

## Error Messages Explained

### "Missing required fields"
**Cause:** One of: user, provider, service, bookingDate, bookingTime is missing
**Fix:** Check all fields are being sent

### "Invalid bookingDate format. Use YYYY-MM-DD"
**Cause:** Date format is wrong
**Fix:** Ensure format is exactly YYYY-MM-DD (e.g., 2025-12-31)

### "Invalid bookingTime format. Use HH:MM (24-hour)"
**Cause:** Time format is wrong
**Fix:** Ensure format is HH:MM (e.g., 14:00, not 2:00 PM)

### "Provider is not approved"
**Cause:** Vendor's isApproved field is false
**Fix:** Run approval command above

### "Service not found"
**Cause:** Service ID doesn't exist in database
**Fix:** Check service exists, try different service

### "Provider not found"
**Cause:** Provider ID doesn't exist
**Fix:** Check provider exists in database

## Testing Checklist

### Before Booking
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] User logged in
- [ ] Vendor approved
- [ ] Service exists

### During Booking
- [ ] Service selected
- [ ] Date selected (future date)
- [ ] Time selected
- [ ] "Book Now" button clicked
- [ ] Modal opens
- [ ] "Confirm Booking" clicked

### After Booking
- [ ] Check browser console for logs
- [ ] Check Network tab for request
- [ ] Check backend logs
- [ ] Check if booking created in DB

## Verify Booking Created

```bash
mongosh
use localsewa

# Check latest booking
db.bookings.find().sort({ createdAt: -1 }).limit(1).pretty()

# Should show:
# {
#   _id: ObjectId("..."),
#   user: ObjectId("..."),
#   provider: ObjectId("..."),
#   service: ObjectId("..."),
#   bookingDate: "2025-12-31",
#   bookingTime: "14:00",
#   confirmationCode: "SJ-ABC1234",
#   status: "pending",
#   ...
# }
```

## Common Scenarios

### Scenario 1: Hardcoded Service
```
Problem: Trying to book hardcoded service
Error: "This is a demo service..."
Solution: This is intentional - book vendor services only
```

### Scenario 2: Unapproved Vendor
```
Problem: Vendor not approved
Error: "Provider is not approved"
Solution: Approve vendor via MongoDB or admin
```

### Scenario 3: Past Date
```
Problem: Selected yesterday
Error: "Cannot book for past date/time"
Solution: Select tomorrow or later
```

### Scenario 4: Not Logged In
```
Problem: No user session
Error: "Please log in to book a service"
Solution: Login first
```

## Advanced Debugging

### Enable Detailed Logging

Add to `Services.tsx`:
```typescript
console.log("User:", user);
console.log("Selected Service:", selectedService);
console.log("Scheduled Date:", scheduledDate);
console.log("Provider ID:", providerId);
```

### Check Request Payload

In browser console after clicking "Confirm Booking":
```javascript
// Should see:
Booking data: {
  user: "673abc...",
  provider: "673def...",
  service: "673ghi...",
  bookingDate: "2025-12-31",
  bookingTime: "14:00"
}
```

### Check Response

```javascript
// Success:
Booking response: {
  msg: "Booking created",
  booking: {
    _id: "...",
    confirmationCode: "SJ-ABC1234",
    ...
  }
}

// Error:
Error response: {
  msg: "Provider is not approved. Service not available."
}
```

## Solution Priority

Try these in order:

1. ✅ **Approve all vendors** (most common issue)
   ```bash
   mongosh
   use localsewa
   db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
   ```

2. ✅ **Check user is logged in**
   - Look for user data in browser console
   - Try logging out and back in

3. ✅ **Select future date/time**
   - Tomorrow or later
   - Valid time format

4. ✅ **Check backend logs**
   - Look for specific error message
   - Check validation failures

5. ✅ **Test with different service**
   - Try another vendor service
   - Avoid hardcoded services

## Get Help

If still not working, provide:
1. Browser console logs
2. Network tab screenshot
3. Backend terminal output
4. MongoDB data (user, provider, service IDs)

---

## Quick Test

```bash
# 1. Approve vendors
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
exit

# 2. Refresh browser
# Press Ctrl+Shift+R

# 3. Try booking again
# - Select tomorrow
# - Select 2:00 PM
# - Click Confirm

# 4. Check console
# Should see: "Booking received! Confirmation SJ-XXXX"
```

---

**Status**: ✅ DEBUGGING GUIDE READY
**Date**: December 2024

**Follow these steps to fix booking issue! 🔧**
