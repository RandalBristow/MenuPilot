# Roles and Permissions

_Last updated: 2026-09-07_

## Platform Owner

The MenuPilot owner operates `/platform`. This role creates and maintains businesses and may enter a selected business context for support and setup.

## Business Owner / Business Admin

Business owners and delegated business administrators operate `/businesses/[businessSlug]/admin`. They own business-wide catalog, media, specials, pricing, locations, and staff permission configuration.

The Manage Employees page can invite an employee by email, create/update their profile, assign one Manager or Staff role, select multiple locations, and save permissions shared across every assigned location.

## Location Manager

Managers are assigned through `location_users` with role `manager`. Permissions are stored per employee and location in `employee_permissions`:

- manage orders
- manage product availability
- manage modifier availability
- manage location ordering
- edit products
- edit modifiers

## Location Employee

Employees are assigned through `location_users` with role `staff`. Permissions are stored per employee and location in `employee_permissions`:

- view orders
- update order status
- view customer contact information
- manage product availability
- manage modifier availability

## Enforcement Status

Permission assignment and storage are implemented. Route and server-action enforcement requires authenticated-user resolution, which remains deferred. Until authentication is connected, owner and staff routes must remain internal.
