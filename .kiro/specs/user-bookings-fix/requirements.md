# Requirements Document

## Introduction

This document specifies the requirements for fixing the booking creation glitch in the Local Sewa application. The issue occurs when users attempt to create a booking from the Services page, resulting in an error response from the backend. This affects the core booking flow and prevents users from successfully scheduling services.

## Glossary

- **User**: A customer who books services through the Local Sewa platform
- **Booking**: A reservation made by a user for a specific service at a scheduled date and time
- **Provider**: A service provider who offers services on the platform
- **Service**: A specific offering provided by a service provider
- **Booking API**: The backend endpoint that handles booking creation requests
- **Confirmation Code**: A unique identifier assigned to each booking (format: SJ-XXXX####)
- **Booking Date**: The date portion of a booking in YYYY-MM-DD format
- **Booking Time**: The time portion of a booking in HH:MM 24-hour format

## Requirements

### Requirement 1

**User Story:** As a user, I want to successfully create a booking from the Services page, so that I can schedule a service.

#### Acceptance Criteria

1. WHEN a user selects a service and date/time THEN the system SHALL validate that all required fields are present before submission
2. WHEN the booking date and time are validated THEN the system SHALL ensure the selected time is in the future
3. WHEN the booking request is sent THEN the system SHALL include user ID, provider ID, service ID, booking date, and booking time
4. WHEN the backend receives a valid booking request THEN the system SHALL create the booking and return a confirmation code
5. WHEN the booking is created successfully THEN the system SHALL display a success message with the confirmation code

### Requirement 2

**User Story:** As a user, I want clear error messages when booking fails, so that I understand what went wrong and can fix it.

#### Acceptance Criteria

1. WHEN the booking request fails THEN the system SHALL extract and display the error message from the backend response
2. WHEN required fields are missing THEN the system SHALL display a message indicating which fields are required
3. WHEN the selected time is in the past THEN the system SHALL display a message asking the user to select a future time
4. WHEN the provider is unavailable THEN the system SHALL display a message indicating the provider cannot be booked
5. WHEN a network error occurs THEN the system SHALL display a user-friendly error message and log details to the console

### Requirement 3

**User Story:** As a user, I want the booking form to validate my input, so that I don't submit invalid data.

#### Acceptance Criteria

1. WHEN a user selects a date and time THEN the system SHALL validate the format is YYYY-MM-DDTHH:MM
2. WHEN the date/time string is split THEN the system SHALL correctly extract the date portion (YYYY-MM-DD) and time portion (HH:MM)
3. WHEN the booking time is extracted THEN the system SHALL ensure it is in HH:MM format by slicing to 5 characters
4. WHEN validating the selected time THEN the system SHALL compare it against the current time to ensure it is in the future
5. WHEN any validation fails THEN the system SHALL prevent the booking request from being sent

### Requirement 4

**User Story:** As a developer, I want to debug booking failures easily, so that I can identify and fix issues quickly.

#### Acceptance Criteria

1. WHEN a booking request is prepared THEN the system SHALL log the booking data to the console
2. WHEN a booking response is received THEN the system SHALL log the response data to the console
3. WHEN a booking error occurs THEN the system SHALL log both the error object and the error response data
4. WHEN extracting the provider ID THEN the system SHALL handle both object and string formats for the provider field
5. WHEN processing the response THEN the system SHALL safely access nested properties using optional chaining

### Requirement 5

**User Story:** As a user, I want the booking modal to close and reset after successful booking, so that I can continue browsing services.

#### Acceptance Criteria

1. WHEN a booking is created successfully THEN the system SHALL close the booking modal
2. WHEN the modal closes THEN the system SHALL reset the selected service to null
3. WHEN the modal closes THEN the system SHALL reset the scheduled date to an empty string
4. WHEN the booking completes THEN the system SHALL set the booking loading state to false
5. WHEN an error occurs THEN the system SHALL keep the modal open so the user can retry with corrections

### Requirement 6

**User Story:** As a user, I want the booking button to be disabled while processing, so that I don't accidentally submit duplicate bookings.

#### Acceptance Criteria

1. WHEN a booking request is in progress THEN the system SHALL disable the booking button
2. WHEN the booking button is disabled THEN the system SHALL display a loading indicator or "Booking..." text
3. WHEN the booking completes successfully THEN the system SHALL re-enable the booking button
4. WHEN the booking fails THEN the system SHALL re-enable the booking button so the user can retry
5. WHEN the modal is closed THEN the system SHALL reset the booking loading state

### Requirement 7

**User Story:** As a system administrator, I want the backend to validate booking requests, so that invalid data is rejected.

#### Acceptance Criteria

1. WHEN the backend receives a booking request THEN the system SHALL validate that user, provider, service, bookingDate, and bookingTime are present
2. WHEN the bookingDate is validated THEN the system SHALL ensure it matches the YYYY-MM-DD format
3. WHEN the bookingTime is validated THEN the system SHALL ensure it matches the HH:MM 24-hour format
4. WHEN the combined date/time is validated THEN the system SHALL ensure it represents a future time
5. WHEN validation fails THEN the system SHALL return a 400 status code with a descriptive error message

### Requirement 8

**User Story:** As a user, I want the system to check for booking conflicts, so that I don't book a provider who is already scheduled.

#### Acceptance Criteria

1. WHEN creating a booking THEN the system SHALL check if the provider already has a booking for the same date and time
2. WHEN a conflict is detected THEN the system SHALL return a 409 status code with a conflict message
3. WHEN a conflict occurs THEN the system SHALL suggest alternative providers or time slots
4. WHEN no conflict exists THEN the system SHALL proceed with creating the booking
5. WHEN checking for conflicts THEN the system SHALL exclude cancelled bookings from the conflict check

### Requirement 9

**User Story:** As a user, I want to view my bookings after creating them, so that I can see my scheduled services.

#### Acceptance Criteria

1. WHEN the system fetches user bookings THEN the backend SHALL return a response with success, data, and message fields
2. WHEN the frontend receives the bookings response THEN the system SHALL correctly extract bookings from the nested data structure
3. WHEN bookings are successfully fetched THEN the system SHALL display them in the user interface sorted by creation date
4. WHEN the bookings fetch fails THEN the system SHALL display an error message and not remain in loading state
5. WHEN no bookings exist for a user THEN the system SHALL display an empty state with a link to browse services
