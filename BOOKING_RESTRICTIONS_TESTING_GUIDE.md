# Booking Restrictions & Recommendations Testing Guide

## Features Implemented

### 1. Duplicate Booking Prevention
**What it does:** Prevents users from booking the same provider twice if they have an active booking.

**How to test:**
1. Login as a user
2. Book a service from any provider (e.g., "Tinkune Plumbing Services")
3. Try to book the SAME provider again (any service from that provider)
4. You should see an error: "You already have an active booking with this provider"
5. Alternative providers will be suggested with distance information

**Active bookings:** Only bookings with status `pending`, `confirmed`, or `scheduled` count as active.
- If you cancel or complete a booking, you can book that provider again.

### 2. Distance-Based Recommendations
**What it does:** Shows nearest providers when you select an area.

**How to test:**
1. On the Services page, select an area from the "Search by Locality" dropdown (e.g., "Tinkune")
2. Services will be sorted by distance (nearest first)
3. Each service card will show "X km away" 
4. Check browser console for distance calculation logs

**Debug logs to check:**
- "Calculating distance for service: [name] from area: [area]"
- "All areas loaded: [count]"
- "Calculated distance: [X] km"

### 3. Hide Booked Providers
**What it does:** Filters out providers you've already booked.

**How to test:**
1. Login as a user
2. Book a service from a provider
3. Check the "Hide providers I've already booked" checkbox
4. That provider's services should disappear from the list
5. Uncheck to see them again (marked with "✓ Booked" badge)

### 4. Visual Indicators
**What it shows:**
- **Green "Vendor" badge:** Real vendor services (not demo)
- **Purple "✓ Booked" badge:** Providers you have active bookings with
- **Blue "Nearest" badge:** Nearest alternative in duplicate booking modal
- **Distance display:** "X km away" when area is selected

## Troubleshooting

### Distance not showing?
**Check:**
1. Did you select an area? Distance only shows when an area is selected.
2. Open browser console (F12) and look for distance calculation logs
3. Check if `allAreas` is loaded: should see "All areas loaded: [number]"
4. Providers need either:
   - `location.coordinates` (for vendor services)
   - `primaryAreaSlug` (for area-based distance)
   - `localitySlug` (for hardcoded services)

### Duplicate booking not working?
**Check:**
1. Are you logged in?
2. Do you have an ACTIVE booking with that provider?
3. Check browser console for "Booking error" logs
4. Backend should return 409 status with "DUPLICATE_BOOKING" error

### Booked badge not showing?
**Check:**
1. Are you logged in?
2. Do you have active bookings? (pending, confirmed, or scheduled)
3. Check browser console for "Failed to fetch user bookings" errors
4. The badge checks PROVIDER ID, not service ID

## Backend Endpoints

### POST /create-booking
- Validates duplicate bookings
- Returns 409 error with alternatives if duplicate detected
- Alternatives are sorted by distance

### GET /recommendations
- Query params: `serviceCategory`, `userLocation`, `hideBooked`, `limit`, `userId`
- Returns providers sorted by distance
- Filters out booked providers if `hideBooked=true`

## Console Logs to Monitor

**Distance Calculation:**
```
Calculating distance for service: [name] from area: [area]
All areas loaded: [count]
Calculated distance: [X] km
```

**Booking Validation:**
```
Booking data: { user, provider, service, bookingDate, bookingTime }
Booking response: { msg, booking }
Booking error: [error details]
```

**User Bookings:**
```
Failed to fetch user bookings [if error]
```

## Expected Behavior

### Scenario 1: First Time Booking
1. User selects area "Tinkune"
2. Services sorted by distance appear
3. User books "Tinkune Plumbing Services"
4. Booking succeeds ✓
5. Provider now shows "✓ Booked" badge

### Scenario 2: Duplicate Booking Attempt
1. User tries to book "Tinkune Plumbing Services" again
2. Error appears: "You already have an active booking with this provider"
3. Alternative providers shown with distances
4. Nearest alternative highlighted with "Nearest" badge
5. User can click alternative to switch

### Scenario 3: Booking After Completion
1. User completes/cancels previous booking
2. Provider no longer shows "✓ Booked" badge
3. User can book that provider again ✓

## Data Requirements

**For distance calculation to work, providers need:**
- Vendor services: `location.coordinates` [lng, lat] OR `primaryAreaSlug`
- Hardcoded services: `localitySlug`

**For duplicate detection to work:**
- User must be logged in
- Bookings must have `user`, `provider`, and `status` fields
- Active statuses: `pending`, `confirmed`, `scheduled`
