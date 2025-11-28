# Admin Dashboard Improvements - Requirements

## Introduction

This feature enhances the admin dashboard with better navigation, service approval workflow, improved data views, and a modern purple-themed UI design.

## Glossary

- **Admin**: System administrator who manages vendors, services, and users
- **Vendor**: Service provider who adds services to the platform
- **Service**: A service offering created by a vendor that requires admin approval
- **CV Status**: The approval status of a vendor's CV (pending, approved, rejected)
- **Dashboard**: The main admin interface after login

## Requirements

### Requirement 1: Direct Dashboard Navigation

**User Story:** As an admin, I want to land directly on the dashboard after login, so that I can immediately access admin functions.

#### Acceptance Criteria

1. WHEN an admin successfully logs in THEN the system SHALL redirect to the admin dashboard page
2. WHEN the dashboard loads THEN the system SHALL display key metrics and navigation options
3. WHEN an admin accesses the root admin route THEN the system SHALL show the dashboard as the default view

### Requirement 2: Service Approval Management

**User Story:** As an admin, I want to view and approve/reject vendor services, so that I can control which services appear on the platform.

#### Acceptance Criteria

1. WHEN an admin views the services list THEN the system SHALL display all vendor-submitted services with their approval status
2. WHEN an admin clicks approve on a service THEN the system SHALL mark the service as approved and make it visible to users
3. WHEN an admin clicks reject on a service THEN the system SHALL mark the service as rejected and hide it from users
4. WHEN a service status changes THEN the system SHALL update the display without requiring a page refresh
5. WHEN displaying services THEN the system SHALL show service name, vendor name, category, price, and current status

### Requirement 3: Real-time Data Updates

**User Story:** As an admin, I want data to update without page refresh, so that I can work efficiently without interruptions.

#### Acceptance Criteria

1. WHEN an admin approves or rejects a vendor THEN the system SHALL update the vendor list without page refresh
2. WHEN an admin approves or rejects a service THEN the system SHALL update the service list without page refresh
3. WHEN viewing users THEN the system SHALL display data without requiring page refresh on actions
4. WHEN data updates occur THEN the system SHALL maintain the current scroll position and view state

### Requirement 4: Unified Vendor Display

**User Story:** As an admin, I want to see vendor information in a single row with CV status, so that I can quickly review vendor details.

#### Acceptance Criteria

1. WHEN displaying vendors THEN the system SHALL show each vendor in a single row
2. WHEN a vendor has a CV THEN the system SHALL display the CV status (approved/pending/rejected) in the same row
3. WHEN displaying vendor rows THEN the system SHALL show name, email, services count, CV status, and approval status
4. WHEN vendors are listed THEN the system SHALL organize them serially with clear visual separation
5. WHEN CV status is displayed THEN the system SHALL use distinct visual indicators for each status

### Requirement 5: Purple-Themed UI Design

**User Story:** As an admin, I want a modern purple-themed interface, so that the admin panel has a distinct and professional appearance.

#### Acceptance Criteria

1. WHEN the admin dashboard loads THEN the system SHALL use a light purple color scheme as the primary theme
2. WHEN displaying interactive elements THEN the system SHALL use purple shades for buttons, links, and highlights
3. WHEN showing status indicators THEN the system SHALL use purple variants for approved/active states
4. WHEN displaying cards and panels THEN the system SHALL use light purple backgrounds with appropriate contrast
5. WHEN hover states occur THEN the system SHALL use darker purple shades for visual feedback
