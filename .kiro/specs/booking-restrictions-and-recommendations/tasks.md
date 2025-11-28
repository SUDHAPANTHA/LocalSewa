# Implementation Plan

- [x] 1. Create booking validation service




  - Implement duplicate booking detection logic
  - Create helper function to check if booking is active
  - Add validation for user-provider booking pairs
  - _Requirements: 1.1, 1.2, 1.4_

- [ ]* 1.1 Write property test for duplicate booking rejection
  - **Property 1: Duplicate booking rejection**
  - **Validates: Requirements 1.1, 1.2, 1.5**

- [ ]* 1.2 Write property test for inactive booking rebooking
  - **Property 2: Inactive booking allows rebooking**
  - **Validates: Requirements 1.3**

- [ ]* 1.3 Write property test for active status definition
  - **Property 3: Active status definition consistency**
  - **Validates: Requirements 1.4, 3.5**





- [ ] 2. Implement distance calculation utilities
  - Create function to calculate distance between user and provider locations
  - Integrate with existing Dijkstra algorithm for Kathmandu areas
  - Add Haversine formula for custom coordinates
  - Handle edge cases for missing location data
  - _Requirements: 2.1, 2.4_

- [x]* 2.1 Write property test for distance calculation completeness




  - **Property 4: Distance calculation completeness**
  - **Validates: Requirements 2.1, 2.5**

- [ ] 3. Create provider recommendation engine
  - Implement provider filtering by service category
  - Add distance calculation for each provider
  - Implement sorting by distance
  - Add booked provider identification logic
  - Implement filtering for already-booked providers
  - _Requirements: 2.2, 2.5, 3.1, 3.2, 3.3_

- [ ]* 3.1 Write property test for distance-based sorting
  - **Property 5: Distance-based sorting**
  - **Validates: Requirements 2.2, 4.3**

- [ ]* 3.2 Write property test for booked provider identification
  - **Property 6: Booked provider identification**
  - **Validates: Requirements 3.1, 3.2**



- [x]* 3.3 Write property test for booked provider filtering


  - **Property 7: Booked provider filtering**
  - **Validates: Requirements 3.3, 4.4**




- [ ] 4. Enhance booking controller with validation
  - Integrate booking validation service into createBooking endpoint
  - Add duplicate booking error handling
  - Format error responses with existing booking details
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 5. Integrate recommendations with booking rejection
  - Trigger recommendation engine when duplicate booking is detected
  - Filter alternatives by service category
  - Exclude already-booked providers from alternatives
  - Include alternatives in error response
  - _Requirements: 4.1, 4.2, 4.4_





- [ ]* 5.1 Write property test for alternative service matching
  - **Property 8: Alternative provider service matching**
  - **Validates: Requirements 4.2**

- [ ]* 5.2 Write property test for recommendation integration
  - **Property 9: Recommendation integration on rejection**
  - **Validates: Requirements 4.1**

- [ ] 6. Create provider recommendations API endpoint
  - Implement GET /api/providers/recommendations endpoint
  - Add query parameter parsing (serviceCategory, userLocation, hideBooked, limit)


  - Integrate with recommendation engine
  - Format response with provider details and distances
  - Add error handling for missing parameters
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.3, 3.4_





- [ ]* 6.1 Write unit tests for recommendations endpoint
  - Test query parameter validation


  - Test response formatting
  - Test error cases (missing location, invalid category)
  - _Requirements: 2.1, 2.2, 2.5_


- [x] 7. Update frontend to handle duplicate booking errors



  - Add error handling in booking creation flow
  - Display alternative provider suggestions to user
  - Show distance information for alternatives
  - Add UI to indicate already-booked providers
  - _Requirements: 1.5, 3.4, 4.5_

- [ ] 8. Integrate recommendations into provider search UI
  - Update Services page to fetch recommendations
  - Display distance information for each provider
  - Add visual indicator for already-booked providers
  - Implement toggle for hiding/showing booked providers
  - Sort providers by distance when location is available
  - _Requirements: 2.2, 2.5, 3.2, 3.3, 3.4_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
