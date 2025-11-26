# Requirements Document

## Introduction

This document specifies the requirements for implementing a comprehensive locality-based search system for the Local Sewa application. The system will allow users to search for services by Kathmandu localities, with intelligent matching, nearby alternatives, and proper vendor integration.

## Glossary

- **Locality**: A specific area or neighborhood within Kathmandu (e.g., Tinkune, Baneshwor, Koteshwor)
- **Kathmandu Areas**: The complete list of localities within the Kathmandu valley
- **Search Widget**: An autocomplete input field that suggests localities as users type
- **Nearby Alternatives**: Services from adjacent localities when no services exist in the selected area
- **Vendor Locality**: The primary service area specified by a vendor during registration
- **Core Services**: System-provided demo/hardcoded services
- **Vendor Services**: Services added by approved vendors

## Requirements

### Requirement 1

**User Story:** As a user, I want to see all Kathmandu localities in a searchable dropdown, so that I can easily find services in my area.

#### Acceptance Criteria

1. WHEN a user clicks on the locality search field THEN the system SHALL display a dropdown with all Kathmandu localities
2. WHEN a user types in the search field THEN the system SHALL filter localities based on the input text
3. WHEN filtering localities THEN the system SHALL match exact names, partial names, and common spelling variants
4. WHEN displaying localities THEN the system SHALL show them in alphabetical order
5. WHEN a user selects a locality THEN the system SHALL update the search field with the selected locality name

### Requirement 2

**User Story:** As a user, I want to search for services by typing a locality name, so that I can quickly find what I need.

#### Acceptance Criteria

1. WHEN a user types a locality name THEN the system SHALL perform case-insensitive matching
2. WHEN matching localities THEN the system SHALL support partial matches (e.g., "Tink" matches "Tinkune")
3. WHEN matching localities THEN the system SHALL support common spelling variants (e.g., "Boudha" and "Bouddha")
4. WHEN multiple localities match THEN the system SHALL show all matching options in the dropdown
5. WHEN no localities match THEN the system SHALL display a "No localities found" message

### Requirement 3

**User Story:** As a user, I want to see only services available in my selected locality, so that I find relevant providers.

#### Acceptance Criteria

1. WHEN a user selects a locality THEN the system SHALL fetch services available in that locality
2. WHEN displaying services THEN the system SHALL show vendor services before core/demo services
3. WHEN a service is displayed THEN the system SHALL show the provider's locality
4. WHEN filtering by locality THEN the system SHALL match services where the provider's locality matches the selected area
5. WHEN no services exist in the selected locality THEN the system SHALL display a message indicating no services are available

### Requirement 4

**User Story:** As a user, I want to see nearby alternatives when my selected area has no services, so that I can still find help.

#### Acceptance Criteria

1. WHEN no services exist in the selected locality THEN the system SHALL automatically search for services in nearby areas
2. WHEN displaying nearby alternatives THEN the system SHALL show the distance or proximity to the selected locality
3. WHEN showing nearby services THEN the system SHALL display a clear message: "No services in [Area]. Showing services near this area:"
4. WHEN nearby alternatives are shown THEN the system SHALL include a CTA button: "Show services near this area"
5. WHEN the user clicks the CTA THEN the system SHALL expand the search radius and display more nearby services

### Requirement 5

**User Story:** As a vendor, I want to specify my service locality during registration, so that customers can find me by location.

#### Acceptance Criteria

1. WHEN a vendor registers THEN the system SHALL require them to select a Kathmandu locality from a dropdown
2. WHEN selecting a locality THEN the system SHALL use the same autocomplete widget as the user search
3. WHEN a vendor saves their locality THEN the system SHALL store it in their profile
4. WHEN a vendor adds a service THEN the system SHALL automatically associate the service with their locality
5. WHEN a vendor updates their locality THEN the system SHALL update all their services to reflect the new location

### Requirement 6

**User Story:** As a vendor, I want my services to appear in locality searches, so that customers in my area can find me.

#### Acceptance Criteria

1. WHEN a user searches for a locality THEN the system SHALL include all vendor services from that locality in the results
2. WHEN displaying search results THEN the system SHALL show vendor services above core/demo services
3. WHEN a vendor service is displayed THEN the system SHALL show the vendor's name and locality
4. WHEN multiple vendors serve the same locality THEN the system SHALL sort them by rating or booking count
5. WHEN a vendor is not approved THEN the system SHALL exclude their services from search results

### Requirement 7

**User Story:** As a system administrator, I want the locality data to be comprehensive and accurate, so that all Kathmandu areas are covered.

#### Acceptance Criteria

1. WHEN the system initializes THEN the locality data SHALL include all major Kathmandu neighborhoods
2. WHEN storing locality data THEN the system SHALL include coordinates (latitude/longitude) for each area
3. WHEN calculating nearby areas THEN the system SHALL use geographic distance based on coordinates
4. WHEN a locality is referenced THEN the system SHALL use a consistent slug format (lowercase, hyphenated)
5. WHEN displaying locality names THEN the system SHALL use the proper capitalized format

### Requirement 8

**User Story:** As a user, I want the search to be fast and responsive, so that I can quickly find services.

#### Acceptance Criteria

1. WHEN a user types in the search field THEN the system SHALL debounce input to avoid excessive API calls
2. WHEN filtering localities THEN the system SHALL perform client-side filtering for instant results
3. WHEN fetching services by locality THEN the system SHALL cache results to improve performance
4. WHEN the locality list loads THEN the system SHALL load it once on page mount and reuse it
5. WHEN switching between localities THEN the system SHALL provide visual feedback during loading

### Requirement 9

**User Story:** As a developer, I want the locality system to be maintainable and extensible, so that we can easily add new areas.

#### Acceptance Criteria

1. WHEN adding a new locality THEN the system SHALL require only adding an entry to the localities data file
2. WHEN locality data is structured THEN the system SHALL include name, slug, coordinates, and district fields
3. WHEN calculating distances THEN the system SHALL use a reusable haversine distance function
4. WHEN finding nearby areas THEN the system SHALL use a configurable radius parameter
5. WHEN the locality system is updated THEN the system SHALL not require changes to multiple files
