# Vendor Approval Process - Complete Guide

## Overview
Vendors must be approved by admin before their services can be booked by users.

## Approval Flow

### Step 1: Vendor Registration
```
Vendor registers → Account created → isApproved: false
```

### Step 2: CV Upload (Optional but Recommended)
```
Vendor uploads CV → cvStatus: "pending" → Admin reviews
```

### Step 3: Admin Approval
```
Admin approves vendor → isApproved: true → Services become bookable
```

## Current Issue

### Problem
**"Provider is not approved. Service not available."**

This error occurs when:
1. Vendor account exists but `isApproved: false`
2. Vendor hasn't been approved by admin yet
3. Trying to book a service from unapproved vendor

### Why Services Show But Can't Be Booked
- Services from unapproved vendors are visible in the list
- But booking is blocked at the backend level
- This is a security feature to prevent bookings from unverified vendors

## Solutions

### Solution 1: Admin Approves Vendor (Recommended)

#### For Admin:
1. Login as admin
2. Go to Admin Dashboard
3. Navigate to "Providers" or "Vendors" section
4. Find the vendor
5. Click "Approve" button
6. Vendor's `isApproved` changes to `true`
7. Services become bookable

#### API Endpoint:
```bash
PATCH /admin-approve-provider/:id
Body: { "isApproved": true }
```

### Solution 2: Auto-Approve on Registration (Development Only)

**⚠️ NOT RECOMMENDED FOR PRODUCTION**

Modify backend registration:

```javascript
// In backend/index.js - provider registration
const payload = {
  name,
  email,
  password: hashed,
  phone,
  address,
  role: roleName,
  isApproved: true, // Auto-approve (DEV ONLY)
  // ... rest of fields
};
```

### Solution 3: Approve via MongoDB Directly

```javascript
// Connect to MongoDB
mongosh

// Use database
use localsewa

// Approve all vendors
db.serviceproviders.updateMany(
  {},
  { $set: { isApproved: true } }
)

// Approve specific vendor by email
db.serviceproviders.updateOne(
  { email: "vendor@test.com" },
  { $set: { isApproved: true } }
)

// Check approval status
db.serviceproviders.find({}, { name: 1, email: 1, isApproved: 1 })
```

## CV Upload Process

### Why Upload CV?
- Helps admin verify vendor credentials
- Automatic scoring based on keywords
- Better trust and quality control

### CV Upload Flow
1. Vendor logs in
2. Goes to profile/settings
3. Uploads PDF CV
4. Backend analyzes CV:
   - Extracts keywords
   - Calculates experience years
   - Detects certifications
   - Generates CV score (0-1)
5. Admin reviews CV and score
6. Admin approves or rejects

### CV Not Required for Approval
**Important:** CV upload is optional. Admin can approve vendors without CV.

## Checking Vendor Approval Status

### Via API
```bash
# Get vendor details
curl http://localhost:5000/provider/:vendorId

# Response includes:
{
  "provider": {
    "_id": "...",
    "name": "Vendor Name",
    "email": "vendor@test.com",
    "isApproved": false,  // ← Check this
    "cvStatus": "not_provided",
    "cvScore": null
  }
}
```

### Via MongoDB
```javascript
db.serviceproviders.find(
  { email: "vendor@test.com" },
  { name: 1, isApproved: 1, cvStatus: 1, cvScore: 1 }
)
```

### Via Frontend (Admin Dashboard)
1. Login as admin
2. View providers list
3. Check "Status" column
4. Look for "Approved" or "Pending" badge

## Fixing "Validation Failed" Error

### Error Message
```
"Provider is not approved. Service not available."
```

### Quick Fix
```bash
# Option 1: Via MongoDB
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })

# Option 2: Via API (as admin)
curl -X PATCH http://localhost:5000/admin-approve-provider/VENDOR_ID \
  -H "Content-Type: application/json" \
  -d '{"isApproved": true}'
```

## Service Visibility vs Bookability

### Current Behavior
| Vendor Status | Services Visible | Services Bookable |
|--------------|------------------|-------------------|
| isApproved: false | ✅ Yes | ❌ No |
| isApproved: true | ✅ Yes | ✅ Yes |

### Why This Design?
- Users can browse all services
- But can only book from verified vendors
- Protects users from unverified providers
- Encourages vendors to complete approval process

## Recommended Workflow

### For Development/Testing
1. Create vendor account
2. Immediately approve via MongoDB:
   ```javascript
   db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
   ```
3. Add services
4. Test bookings

### For Production
1. Vendor registers
2. Vendor uploads CV (optional)
3. Admin reviews vendor profile
4. Admin checks CV score (if uploaded)
5. Admin approves vendor
6. Vendor can now receive bookings

## Admin Approval Interface

### What Admin Should Check
- [ ] Vendor name and contact info
- [ ] CV uploaded and scored (if available)
- [ ] Service quality and descriptions
- [ ] No suspicious activity
- [ ] Valid business information

### Approval Actions
```typescript
// Approve vendor
await adminApi.approveProvider(vendorId, {
  isApproved: true,
  cvStatus: "approved", // if CV was uploaded
  reviewerNote: "Verified credentials"
});

// Reject vendor
await adminApi.approveProvider(vendorId, {
  isApproved: false,
  cvStatus: "rejected",
  reviewerNote: "Insufficient credentials"
});
```

## Testing Checklist

### Test Unapproved Vendor
- [ ] Vendor registers
- [ ] Vendor adds service
- [ ] Service appears in user list
- [ ] User tries to book
- [ ] Error: "Provider is not approved"

### Test Approved Vendor
- [ ] Admin approves vendor
- [ ] Vendor's services still visible
- [ ] User tries to book
- [ ] Booking succeeds
- [ ] Confirmation code generated

## Common Issues

### Issue 1: Services not showing at all
**Cause:** Provider object not populated
**Fix:** Check backend populate query includes provider

### Issue 2: Can't book any services
**Cause:** All vendors unapproved
**Fix:** Approve at least one vendor

### Issue 3: Hardcoded services can't be booked
**Cause:** Hardcoded services are demos only
**Fix:** This is intentional - they show "View Details" not "Book Now"

## Quick Commands

### Approve All Vendors (MongoDB)
```javascript
mongosh
use localsewa
db.serviceproviders.updateMany({}, { $set: { isApproved: true } })
```

### Check Vendor Status
```javascript
db.serviceproviders.find({}, { name: 1, email: 1, isApproved: 1 })
```

### Create Pre-Approved Vendor
```bash
curl -X POST http://localhost:5000/provider-register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Vendor",
    "email": "vendor@test.com",
    "password": "Test@123",
    "phone": "9800000000",
    "address": "Kathmandu",
    "localAreaSlug": "tinkune"
  }'

# Then approve
mongosh
use localsewa
db.serviceproviders.updateOne(
  { email: "vendor@test.com" },
  { $set: { isApproved: true } }
)
```

---

## Summary

✅ **Vendors must be approved to receive bookings**
✅ **CV upload is optional but recommended**
✅ **Admin can approve vendors with or without CV**
✅ **Services show for all vendors, but only approved ones are bookable**

**For testing:** Approve all vendors via MongoDB
**For production:** Use proper admin approval workflow

---

**Status**: ✅ DOCUMENTED
**Date**: December 2024
