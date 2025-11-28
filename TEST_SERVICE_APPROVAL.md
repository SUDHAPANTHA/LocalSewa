# Service Approval Testing Guide

## Test Scenario: Vendor Creates Service → Admin Approves

### Step 1: Create Service as Vendor

1. **Login as Vendor**
   - Go to: `http://localhost:5173/#/login`
   - Select: "Service Provider"
   - Enter vendor credentials
   - Should redirect to: `#/vendor/dashboard`

2. **Navigate to Services**
   - Click "My Services" in sidebar
   - Or go to: `#/vendor/services`

3. **Add New Service**
   - Click "Add Service" button
   - Fill in form:
     - Name: "Test Plumbing Service"
     - Description: "Professional plumbing repairs and installations"
     - Price: 1500
     - Category: plumbing
   - Click "Add Service"
   - ✅ Should see success message: "Service added successfully! It will appear after admin approval."
   - ✅ Should see service in table with 🟡 Yellow "Pending" badge

### Step 2: Verify Service in Admin Panel

1. **Login as Admin**
   - Logout from vendor account
   - Go to: `http://localhost:5173/#/login`
   - Select: "Admin"
   - Enter admin credentials
   - Should redirect to: `#/admin/dashboard`

2. **Navigate to Services**
   - Click "Manage Services" card
   - Or go to: `#/admin/services`

3. **Check Service Appears**
   - ✅ Should see "Test Plumbing Service" in the list
   - ✅ Service should show 🟡 Yellow "Pending Review" badge
   - ✅ Should see "Approve" and "Reject" buttons

4. **Filter by Pending**
   - Click "Pending" filter button
   - ✅ Should see only pending services
   - ✅ "Test Plumbing Service" should be visible

### Step 3: Approve Service

1. **Click Approve Button**
   - Find "Test Plumbing Service"
   - Click green "Approve" button
   - ✅ Should see success message: "Service approved successfully"
   - ✅ Service should now show ✅ Green "Approved" badge

2. **Verify in Approved Filter**
   - Click "Approved" filter button
   - ✅ "Test Plumbing Service" should appear here

### Step 4: Verify Vendor Sees Update

1. **Login as Vendor Again**
   - Go back to vendor account
   - Navigate to "My Services"
   - ✅ "Test Plumbing Service" should show ✅ Green "Approved - Visible to users" badge

### Step 5: Verify Users Can See Service

1. **Login as User**
   - Logout and login as regular user
   - Go to "Services" page
   - ✅ "Test Plumbing Service" should appear in service listings
   - ✅ Users can now book this service

## Test Scenario: Reject Service

### Step 1: Create Another Service as Vendor
- Add service: "Test Service 2"
- Should show as "Pending"

### Step 2: Reject as Admin
- Go to Admin Services
- Click "Pending" filter
- Find "Test Service 2"
- Click red "Reject" button
- ✅ Should see: "Service rejected successfully"
- ✅ Service shows ❌ Red "Rejected" badge

### Step 3: Verify Vendor Sees Rejection
- Login as vendor
- Go to "My Services"
- ✅ "Test Service 2" shows ❌ Red "Rejected by admin" badge

### Step 4: Verify Users Cannot See Rejected Service
- Login as user
- Go to "Services"
- ✅ "Test Service 2" should NOT appear in listings

## Expected Database State

### After Vendor Creates Service
```javascript
{
  name: "Test Plumbing Service",
  description: "Professional plumbing repairs...",
  price: 1500,
  category: "plumbing",
  provider: ObjectId("..."),
  isApproved: null,  // ← Pending
  createdAt: "2024-..."
}
```

### After Admin Approves
```javascript
{
  ...
  isApproved: true,  // ← Approved
}
```

### After Admin Rejects
```javascript
{
  ...
  isApproved: false,  // ← Rejected
}
```

## API Calls to Monitor

### 1. Vendor Creates Service
```
POST /provider-add-service/:providerId
Body: { name, description, price, category }
Response: { msg: "Service added", services: [...] }
```

### 2. Admin Fetches All Services
```
GET /admin/services
Response: { services: [...] }  // All services, regardless of approval status
```

### 3. Admin Approves Service
```
PATCH /admin/service-approve/:serviceId
Body: { isApproved: true }
Response: { msg: "Service approved", service: {...} }
```

### 4. User Fetches Services
```
GET /services
Response: { services: [...] }  // Only approved services (isApproved === true)
```

## Troubleshooting

### Service Not Appearing in Admin Panel
- Check backend console for errors
- Verify service was created: Check MongoDB or backend logs
- Refresh admin page
- Check network tab for `/admin/services` response

### Service Not Updating After Approval
- Check network tab for `/admin/service-approve/:id` response
- Verify backend route exists
- Check for JavaScript errors in console
- Try refreshing the page

### Users Can See Unapproved Services
- Check `/services` endpoint filtering logic
- Verify `isApproved === true` check is in place
- Check if service is marked as `isCore: true` (core services bypass approval)

## Quick Test Commands

### Check Service in Database (MongoDB)
```javascript
db.services.find({ name: "Test Plumbing Service" })
```

### Check All Pending Services
```javascript
db.services.find({ isApproved: null })
```

### Check All Approved Services
```javascript
db.services.find({ isApproved: true })
```

### Manually Approve Service
```javascript
db.services.updateOne(
  { name: "Test Plumbing Service" },
  { $set: { isApproved: true } }
)
```
