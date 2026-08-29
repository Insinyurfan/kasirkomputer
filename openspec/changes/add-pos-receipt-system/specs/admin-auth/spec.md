## Purpose

Protects the application with a single admin password so only the shop owner can use the POS, without any user registration or account management.

## ADDED Requirements

### Requirement: Single-password admin login

The system SHALL authenticate the admin against a single password configured in the server environment. There SHALL be no sign-up, no username, and no stored user records. Password comparison SHALL be done in a way that does not leak timing information, and the configured password SHALL NOT be sent to the browser.

#### Scenario: Correct password

- **WHEN** the admin submits the correct password on the login page
- **THEN** a session is established and the admin is redirected to the POS home

#### Scenario: Wrong password

- **WHEN** the admin submits an incorrect password
- **THEN** login is rejected with a generic "incorrect password" message and no session is created

#### Scenario: No password configured

- **WHEN** the server has no admin password configured
- **THEN** the application refuses to serve protected pages and shows an instruction to set the password

### Requirement: Session cookie

On successful login the system SHALL set an HTTP-only, SameSite session cookie that is marked Secure when served over HTTPS. The session SHALL remain valid until logout or expiry. The session value SHALL be signed or otherwise tamper-evident.

#### Scenario: Session persists across page loads

- **WHEN** the admin logs in and then navigates to another page or reloads
- **THEN** the admin stays logged in without re-entering the password

#### Scenario: Tampered cookie rejected

- **WHEN** a request presents a modified or forged session cookie
- **THEN** the system treats the request as unauthenticated

### Requirement: All application routes require authentication

Every page and data endpoint except the login page and static assets SHALL require a valid session. Unauthenticated requests to a protected page SHALL redirect to login; unauthenticated data requests SHALL fail with an unauthorized response.

#### Scenario: Unauthenticated page access

- **WHEN** a user with no session opens the POS or product list URL directly
- **THEN** they are redirected to the login page

#### Scenario: Unauthenticated data access

- **WHEN** a request with no valid session calls a data endpoint (for example creating a sale)
- **THEN** the request is rejected as unauthorized and no data changes

### Requirement: Logout

The system SHALL provide a logout action that clears the session cookie and returns the admin to the login page.

#### Scenario: Logout

- **WHEN** the admin chooses logout
- **THEN** the session cookie is cleared and opening any protected page redirects to login
