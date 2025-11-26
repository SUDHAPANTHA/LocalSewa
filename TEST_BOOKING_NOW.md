# 🧪 Test Booking - Step by Step

## Issue: "Booking failed" error

## Step 1: Clear Browser Cache & Refresh
```
1. Press Ctrl + Shift + Delete
2. Select "Cached images and files"
3. Click "Clear data"
4. Close browser
5. Reopen and go to http://localhost:5173
```

## Step 2: Approve All Vendors
```bash
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
db.serviceproviders.find({}, { name: 1, isApproved: 1 })
# All should show: isApproved: true
exit
```

## Step 3: Check Browser Console
```
1. Open browser (http://localhost:5173)
2. Press F12 to open DevTools
3. Go to Console tab
4. Clear console (click 🚫 icon)
```

## Step 4: Try Booking
```
1. Go to Services page
2. Find a service with green "Vendor" badge
3. Click "Book Now"
4. Select tomorrow's date
5. Select 2:00 PM (14:00)
6. Click "Confirm Booking"
```

## Step 5: Check Console Output

### If Successful:
```
Booking data: {
  user: "673...",
  provider: "673...",
  service: "673...",
  bookingDate: "2025-12-31",
  bookingTime: "14:00"
}
Booking response: {
  msg: "Booking created",
  booking: { confirmationCode: "SJ-ABC1234", ... }
}
```

### If Failed:
```
Booking error: {...}
Error response: {
  msg: "EXACT ERROR MESSAGE HERE"
}
```

## Common Error Messages:

### "Provider is not approved. Service not available."
**Fix:**
```bash
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
```

### "Missing required fields"
**Fix:** Make sure date and time are selected

### "Invalid bookingDate format"
**Fix:** Use the date picker, don't type manually

### "Cannot book for past date/time"
**Fix:** Select tomorrow or later

## Quick Debug Commands:

### Check if vendor is approved:
```bash
mongosh
use localsewa
db.serviceproviders.find(
  { _id: ObjectId("PROVIDER_ID_FROM_CONSOLE") },
  { name: 1, isApproved: 1 }
)
```

### Check if user exists:
```bash
db.users.find(
  { _id: ObjectId("USER_ID_FROM_CONSOLE") },
  { name: 1, email: 1 }
)
```

### Check if service exists:
```bash
db.services.find(
  { _id: ObjectId("SERVICE_ID_FROM_CONSOLE") },
  { name: 1, provider: 1 }
)
```

## What to Share:

If still not working, share:

1. **Console output** (copy the "Booking error" and "Error response" lines)
2. **Network tab** (F12 → Network → find "create-booking" → Response)
3. **Backend logs** (what shows in backend terminal)

## Example of What I Need:

```
Console shows:
Booking error: Error: Request failed with status code 400
Error response: { msg: "Provider is not approved. Service not available." }

Backend shows:
[API] POST /create-booking -> 400 (25ms)
```

Then I can tell you exactly what's wrong!

---

## Most Likely Fix:

```bash
# 99% of booking issues are fixed by this:
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
exit

# Then refresh browser:
Ctrl + Shift + R
```

---

**Browser console ma "Error response:" dekheko message malai bhannus! 🔍**
