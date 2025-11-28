# Design Document

## Overview

This feature enhances the booking system by implementing duplicate booking prevention and intelligent provider recommendations based on geographic proximity. The system will validate booking requests against existing active bookings and provide location-aware provider suggestions when bookings are rejected or when users browse available providers.

The implementation leverages the existing MongoDB booking model, service provider location data, and the Kathmandu areas graph structure with Dijkstra's algorithm for distance calculations.

## Architecture

The solution follows a layered architecture:

1. **Validation Layer**: Booking duplicate detection logic
2. **Recommendation Engine**: Provider filtering and sorting based on location
3. **Controller Layer**: Enhanced booking controller with validation and recommendations
4. **API Layer**: New endpoints for provider recommendations

### Component Interaction Flow

```
User Request → Controller → Validation Layer → Database Query
                    ↓
              (if duplicate detected)
                    ↓
         Recommendation Engine → Sorted Providers → Response
```

## Components and Interfaces

### 1. Booking Validation Service

**Purpose**: Validate booking requests to prevent duplicates

**Interface**:
```javascript
// bookingValidation.js
export async function checkDuplicateBooking(userId, providerId)
export function isActiveBooking(booking)
```

**Responsibilities**:
- Query database for existing bookings between user and provider
- Filter bookings by active status (pending, confirmed, scheduled)
- Return validation result with error details

### 2. Provider Recommendation Engine

**Purpose**: Generate location-based provider recommendations

**Interface**:
```javascript
// providerRecommendation.js
export async function getRecommendedProviders(options)
export async function filterBookedProviders(providers, userId)
export function calculateProviderDistance(userLocation, providerLocation)
export function sortProvidersByDistance(providers, userLocation)
```

**Responsibilities**:
- Calculate distances between user and providers
- Filter out already-booked providers
- Sort providers by proximity
- Return ranked provider list with distance metadata

### 3. Enhanced Booking Controller

**Purpose**: Orchestrate booking creation with validation and recommendations

**Interface**:
```javascript
// bookingController.js (enhanced)
export async function createBooking(req, res)
export async function getAlternativeProviders(req, res)
```

**Responsibilities**:
- Validate booking requests
- Handle duplicate booking errors
- Trigger recommendation engine on rejection
- Return appropriate responses with alternatives

## Data Models

### Booking Model (existing)

The existing booking schema already contains the necessary fields:
- `user`: Reference to User
- `provider`: Reference to ServiceProvider
- `status`: Enum (pending, confirmed, scheduled, completed, cancelled)
- `customerLocation`: GeoJSON Point with coordinates

**Active Booking Definition**: A booking with status in `['pending', 'confirmed', 'scheduled']`

### Service Provider Model (existing)

The existing provider schema contains:
- `location`: GeoJSON Point with coordinates
- `services`: Array of service references
- `serviceRadiusKm`: Service coverage radius

### Distance Calculation Result

```javascript
{
  provider: ServiceProvider,
  distanceKm: Number,
  isBooked: Boolean,
  service: Service
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Duplicate booking rejection
*For any* user and service provider, if the user has an active booking (pending, confirmed, or scheduled) with that provider, then attempting to create a new booking should be rejected with an error message indicating the duplicate.
**Validates: Requirements 1.1, 1.2, 1.5**

### Property 2: Inactive booking allows rebooking
*For any* user and service provider, if the user has a booking with status completed or cancelled, then the user should be able to create a new booking with that same provider successfully.
**Validates: Requirements 1.3**

### Property 3: Active status definition consistency
*For any* booking validation or filtering operation, only bookings with status in ['pending', 'confirmed', 'scheduled'] should be considered active, and all other statuses should be considered inactive.
**Validates: Requirements 1.4, 3.5**

### Property 4: Distance calculation completeness
*For any* provider search with a user location, every provider in the results should have a calculated distance value from the user's location.
**Validates: Requirements 2.1, 2.5**

### Property 5: Distance-based sorting
*For any* list of providers with calculated distances, the results should be sorted in ascending order by distance from the user's location.
**Validates: Requirements 2.2, 4.3**

### Property 6: Booked provider identification
*For any* provider recommendation request, all providers that have active bookings with the requesting user should be correctly identified and marked with an isBooked flag.
**Validates: Requirements 3.1, 3.2**

### Property 7: Booked provider filtering
*For any* provider recommendation with hideBooked=true, the results should exclude all providers that have active bookings with the requesting user.
**Validates: Requirements 3.3, 4.4**

### Property 8: Alternative provider service matching
*For any* rejected booking due to duplicate, all suggested alternative providers should offer services in the same category as the originally requested service.
**Validates: Requirements 4.2**

### Property 9: Recommendation integration on rejection
*For any* booking request that is rejected due to duplicate booking, the response should include a list of alternative provider recommendations.
**Validates: Requirements 4.1**

## Error Handling

### Duplicate Booking Error
- **Status Code**: 409 Conflict
- **Error Message**: "You already have an active booking with this provider"
- **Response Body**:
```javascript
{
  error: "DUPLICATE_BOOKING",
  message: "You already have an active booking with this provider",
  existingBooking: {
    id: String,
    status: String,
    bookingDate: String
  },
  alternatives: [
    {
      provider: Object,
      distanceKm: Number,
      service: Object
    }
  ]
}
```

### Location Missing Error
- **Status Code**: 400 Bad Request
- **Error Message**: "User location required for distance-based recommendations"

### No Alternatives Available
- **Status Code**: 200 OK
- **Response**: Empty alternatives array with informative message

### Database Errors
- **Status Code**: 500 Internal Server Error
- **Error Handling**: Log error details, return generic message to client

## Testing Strategy

### Unit Testing

Unit tests will cover:
- Duplicate booking detection logic with specific user-provider pairs
- Distance calculation with known coordinates
- Active booking status filtering with specific status values
- Error response formatting
- Edge cases: missing location data, empty provider lists, no alternatives available

**Testing Framework**: Jest or Mocha (based on existing backend setup)

### Property-Based Testing

Property-based tests will verify universal correctness properties across randomly generated inputs:

**Testing Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test MUST include a comment tag in this format:
```javascript
// Feature: booking-restrictions-and-recommendations, Property 1: Duplicate booking rejection
```

**Property Test Coverage**:
- Property 1: Generate random users, providers, and active bookings, verify duplicates are rejected
- Property 2: Generate bookings with completed/cancelled status, verify rebooking succeeds
- Property 3: Generate bookings with all possible statuses, verify active status definition
- Property 4: Generate random user locations and provider sets, verify all have distances
- Property 5: Generate random provider lists with distances, verify ascending sort order
- Property 6: Generate random bookings and provider lists, verify booked flag accuracy
- Property 7: Generate provider lists with some booked, verify filtering works correctly
- Property 8: Generate rejected bookings, verify alternatives match service category
- Property 9: Generate duplicate booking scenarios, verify alternatives are included

**Generators**:
- User generator: Random user IDs
- Provider generator: Random provider objects with locations and service categories
- Booking generator: Random bookings with various statuses
- Location generator: Random valid coordinates within Kathmandu area bounds
- Service category generator: Random categories from SERVICE_CATEGORIES enum

### Integration Testing

Integration tests will verify:
- End-to-end booking creation flow with validation
- Database queries for duplicate detection
- Recommendation engine integration with booking controller
- API endpoint responses with correct status codes and data structure

## Implementation Notes

### Distance Calculation Strategy

The system will use two approaches for distance calculation:

1. **Graph-based (Dijkstra)**: For areas within the Kathmandu areas graph, use the existing `dijkstraShortestRoute` function for accurate road-distance calculations
2. **Haversine formula**: For providers with custom coordinates outside the predefined areas, use direct geographic distance calculation

### Performance Considerations

- **Caching**: Consider caching distance calculations for frequently accessed user-provider pairs
- **Indexing**: Leverage existing 2dsphere index on provider locations for geospatial queries
- **Pagination**: Implement pagination for provider recommendations to handle large result sets
- **Query Optimization**: Use MongoDB aggregation pipeline to combine booking checks and provider queries

### Backward Compatibility

- Existing booking creation flow remains unchanged for users without location data
- New validation is additive and doesn't break existing API contracts
- Recommendation endpoint is new and optional

## API Endpoints

### POST /api/bookings
**Enhanced with validation and recommendations**

Request:
```javascript
{
  user: ObjectId,
  provider: ObjectId,
  service: ObjectId,
  bookingDate: String,
  bookingTime: String,
  customerLocation: {
    coordinates: [lng, lat],
    formattedAddress: String
  }
}
```

Response (Success):
```javascript
{
  msg: "Booking created",
  booking: Object
}
```

Response (Duplicate Error):
```javascript
{
  error: "DUPLICATE_BOOKING",
  message: "You already have an active booking with this provider",
  existingBooking: Object,
  alternatives: Array
}
```

### GET /api/providers/recommendations
**New endpoint for provider recommendations**

Query Parameters:
- `serviceCategory`: String (required)
- `userLocation`: String (lat,lng format)
- `hideBooked`: Boolean (default: false)
- `limit`: Number (default: 10)

Response:
```javascript
{
  providers: [
    {
      provider: Object,
      distanceKm: Number,
      isBooked: Boolean,
      service: Object
    }
  ],
  total: Number
}
```
