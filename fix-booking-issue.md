# 🔧 Quick Fix - Booking Issue

## Most Common Issue: Vendor Not Approved

### Quick Fix (30 seconds):

```bash
# Open MongoDB shell
mongosh

# Switch to database
use localsewa

# Approve ALL vendors
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })

# Verify
db.serviceproviders.find({}, { name: 1, email: 1, isApproved: 1 })

# Exit
exit
```

### Then:
1. Refresh browser (Ctrl + Shift + R)
2. Try booking again
3. Should work now! ✅

## If Still Not Working:

### Check Browser Console:
1. Press F12
2. Go to Console tab
3. Look for error message
4. Share the error here

### Check These:
- [ ] Backend running? (Terminal should show "Server running on port 5000")
- [ ] Frontend running? (Should be on http://localhost:5173)
- [ ] Logged in as user?
- [ ] Selected future date/time?
- [ ] Trying to book vendor service (not hardcoded)?

## Error Messages & Fixes:

### "Provider is not approved"
```bash
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
```

### "Please log in to book a service"
- Click Login
- Enter credentials
- Try again

### "This is a demo service"
- Don't book hardcoded services
- Book vendor services only (ones with green "Vendor" badge)

### "Please select a valid date and time"
- Select tomorrow or later
- Make sure time is selected
- Use the datetime picker

### "Please select a future date and time"
- Don't select today or past dates
- Select tomorrow or later

## Test Booking:

1. Go to Services page
2. Find a service with green "Vendor" badge
3. Click "Book Now"
4. Select tomorrow's date
5. Select 2:00 PM
6. Click "Confirm Booking"
7. Should see: "Booking received! Confirmation SJ-XXXX"

## Still Having Issues?

Run this complete check:

```bash
# Check MongoDB
mongosh
use localsewa

# 1. Check vendors
db.serviceproviders.find({}, { name: 1, isApproved: 1 })
# All should show: isApproved: true

# 2. Check services
db.services.find({ isCore: false }, { name: 1, provider: 1 })
# Should show vendor services

# 3. Check users
db.users.find({}, { name: 1, email: 1 })
# Should show your user

exit
```

Then share:
1. Browser console screenshot
2. Error message
3. What you see in MongoDB

---

**Most likely fix: Run the approval command above! 🚀**
