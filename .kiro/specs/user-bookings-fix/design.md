# Design Document

## Overview

This document outlines the technical design for fixing the booking creation and fetching glitches in the Local Sewa application. The issues stem from:

1. **Response format mismatch**: The backend uses different response formats for different endpoints
2. **Data extraction errors**: The frontend incorrectly accesses nested response data
3. **Error handling gaps**: Insufficient error logging and user feedback

The solution involves standardizing API response handling on the frontend and ensuring proper error handling throughout the booking flow.

## Architecture

### Current Flow

```
User (Services Page) → Create Booking API → Backend validates → Creates booking → Returns response
User (Bookings Page) → Get Bookings API → Backend fetches → Returns response → Frontend displays
```

### Issues Identified

1. **Backend Response Inconsistency**:
   - `/create-booking` returns: `{ msg: string, booking: Booking }`
   - `/get-user-bookings/:userId` returns: `{ success: boolean, data: { bookings: Booking[] }, message: string }`

2. **Frontend Data Access**:
   - UserBookings.tsx correctly accesses: `response.data.data.bookings`
   - Services.tsx correctly accesses: `response.data.booking`
   - Both are correct for their respective endpoints

3. **Error Scenarios Not Handled**:
   - Network timeouts
   - Invalid provider/service IDs
   - Database connection failures
   - Validation errors

## Components and Interfaces

### Frontend Components

#### Services.tsx
- **Purpose**: Display services and handle booking creation
- **Key Functions**:
  - `handleBooking()`: Creates a new booking
  - Validates date/time input
  - Extracts provider ID from service object
  - Handles booking response and errors

#### UserBookings.tsx
- **Purpose**: Display and manage user bookings
- **Key Functions**:
  - `useEffect()`: Fetches bookings on mount
  - `fetchUserReviews()`: Loads review data
  - `handleUpdateBooking()`: Updates booking date/time
  - `confirmCancelBooking()`: Cancels a booking

### Backend Endpoints

#### POST /create-booking
- **Input**: `{ user, provider, service, bookingDate, bookingTime }`
- **Output**: `{ msg: string, booking: Booking }`
- **Validations**:
  - Required fields present
  - Date format: YYYY-MM-DD
  - Time format: HH:MM
  - DateTime is in future
  - Provider exists and is approved
  - Service exists
  - No booking conflict

#### GET /get-user-bookings/:userId
- **Input**: `userId` (URL parameter)
- **Output**: `{ success: boolean, data: { bookings: Booking[] }, message: string }`
- **Behavior**:
  - Fetches all bookings for user
  - Populates user, provider, and service references
  - Sorts by creation date (newest first)

## Data Models

### Booking Model
```typescript
interface Booking {
  _id: string;
  user: string | User;
  provider: string | Provider;
  service: string | Service;
  bookingDate: string;        // YYYY-MM-DD
  bookingTime: string;        // HH:MM
  bookingDateTime: Date;
  totalAmount: number;
  confirmationCode: string;   // SJ-XXXX####
  status: BookingStatus;
  statusTimeline: StatusEntry[];
  isProviderApproved?: boolean;
  isAdminApproved?: boolean;
  customerAreaSlug?: string;
  customerAreaName?: string;
  customerLocation?: GeoLocation;
  createdAt: Date;
  updatedAt: Date;
}
```

### API Response Formats

#### Success Response (standardized)
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}
```

#### Error Response (standardized)
```typescript
interface ErrorResponse {
  success: false;
  data: any;
  message: string;
}
```

#### Legacy Response (create-booking)
```typescript
interface LegacyBookingResponse {
  msg: string;
  booking: Booking;
}
```

## Error Handling

### Frontend Error Handling Strategy

1. **Network Errors**:
   - Catch axios errors
   - Extract error message from `error.response?.data?.msg` or `error.response?.data?.message`
   - Display user-friendly toast notification
   - Log full error to console for debugging

2. **Validation Errors**:
   - Check inputs before API call
   - Show specific validation messages
   - Prevent API call if validation fails

3. **Loading States**:
   - Set loading state before API call
   - Always reset loading state in finally block
   - Prevent UI interactions during loading

### Backend Error Handling Strategy

1. **Validation Errors** (400):
   - Missing required fields
   - Invalid date/time format
   - Past date/time selected
   - Return descriptive error message

2. **Not Found Errors** (404):
   - Service not found
   - Provider not found
   - User not found

3. **Conflict Errors** (409):
   - Provider already booked for slot
   - Return suggestions for alternatives

4. **Server Errors** (500):
   - Database errors
   - Unexpected exceptions
   - Log error details
   - Return generic error message to user

## Testing Strategy

### Unit Tests

1. **Date/Time Validation**:
   - Test valid formats (YYYY-MM-DD, HH:MM)
   - Test invalid formats
   - Test past dates rejection
   - Test future dates acceptance

2. **Provider ID Extraction**:
   - Test with provider as object
   - Test with provider as string ID
   - Test with missing provider

3. **Response Data Extraction**:
   - Test successful booking creation response
   - Test successful bookings fetch response
   - Test error response handling

4. **Error Message Extraction**:
   - Test with `msg` field
   - Test with `message` field
   - Test with nested error data
   - Test with network errors

### Integration Tests

1. **Booking Creation Flow**:
   - Select service
   - Choose date/time
   - Submit booking
   - Verify success message
   - Verify booking appears in list

2. **Booking Fetch Flow**:
   - Navigate to bookings page
   - Verify loading state
   - Verify bookings display
   - Verify empty state when no bookings

3. **Error Scenarios**:
   - Test with invalid date
   - Test with past date
   - Test with unavailable provider
   - Test with network timeout

## Implementation Plan

### Phase 1: Fix Critical Issues

1. **Verify Response Handling**:
   - Confirm UserBookings.tsx correctly accesses `response.data.data.bookings`
   - Confirm Services.tsx correctly accesses `response.data.booking`
   - Add null checks and optional chaining

2. **Improve Error Logging**:
   - Log full error object
   - Log error response data
   - Log request payload for debugging

3. **Add Timeout Handling**:
   - Ensure API calls have reasonable timeouts (already set to 10s)
   - Handle timeout errors gracefully

### Phase 2: Enhance User Experience

1. **Better Error Messages**:
   - Map backend error codes to user-friendly messages
   - Provide actionable guidance (e.g., "Please select a future date")

2. **Loading States**:
   - Show skeleton loaders instead of "Loading bookings..."
   - Add progress indicators for booking creation

3. **Success Feedback**:
   - Show confirmation code prominently
   - Provide link to view booking details

### Phase 3: Prevent Future Issues

1. **Type Safety**:
   - Define strict TypeScript interfaces for all API responses
   - Use type guards for runtime validation

2. **API Client Standardization**:
   - Create response wrapper functions
   - Standardize error extraction logic
   - Add request/response interceptors

3. **Monitoring**:
   - Add error tracking (e.g., Sentry)
   - Log API performance metrics
   - Track booking success/failure rates

## Security Considerations

1. **Input Validation**:
   - Validate all user inputs on both frontend and backend
   - Sanitize date/time strings
   - Prevent SQL injection through parameterized queries (using Mongoose)

2. **Authorization**:
   - Verify user owns booking before allowing updates/cancellations
   - Check provider approval status before allowing bookings

3. **Rate Limiting**:
   - Implement rate limiting on booking creation endpoint
   - Prevent spam bookings

## Performance Considerations

1. **Database Queries**:
   - Use indexes on user, provider, service fields
   - Populate only necessary fields
   - Limit query results appropriately

2. **Frontend Optimization**:
   - Use React.memo for booking cards
   - Implement virtual scrolling for large booking lists
   - Cache booking data with SWR or React Query

3. **API Response Size**:
   - Only return necessary fields
   - Paginate booking lists for users with many bookings

## Deployment Strategy

1. **Backend Changes**:
   - No breaking changes required
   - Current response formats are correct
   - Deploy backend first (no changes needed)

2. **Frontend Changes**:
   - Fix any incorrect data access patterns
   - Improve error handling
   - Add better logging
   - Deploy frontend after testing

3. **Rollback Plan**:
   - Keep previous frontend version available
   - Monitor error rates after deployment
   - Quick rollback if issues detected

## Monitoring and Alerting

1. **Key Metrics**:
   - Booking creation success rate
   - Booking fetch success rate
   - Average response times
   - Error rates by type

2. **Alerts**:
   - Alert if booking creation success rate drops below 95%
   - Alert if API response time exceeds 5 seconds
   - Alert on 500 errors

3. **Logging**:
   - Log all booking creations
   - Log all booking fetch requests
   - Log all errors with full context
