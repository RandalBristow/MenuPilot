# Routes

_Last updated: 2026-09-06_

This file is the authoritative route inventory. Business administration is always tenant-scoped by `businessSlug`. The former unscoped admin routes and pre-catalog tenant admin routes have been removed.

Status values:

- `current`: active route in the current product flow.
- `hidden/internal`: active workflow route that is not a primary navigation destination.
- `review pending`: retained until its role and replacement are reviewed.
- `future/planned`: not implemented.

## Platform Owner

These internal routes are for the MenuPilot platform owner. Authentication and role enforcement are still deferred.

| Route | Status | Purpose |
| --- | --- | --- |
| `/platform` | hidden/internal | Platform-owner onboarding and administration hub. |
| `/platform/businesses` | hidden/internal | List every business and its setup state. |
| `/platform/businesses/new` | hidden/internal | Create a business and its initial location. |
| `/platform/businesses/[businessId]` | hidden/internal | Edit business identity, contacts, status, locations, orderability, and pricing with one page-level save. |

## Workforce Authentication

| Route | Status | Purpose |
| --- | --- | --- |
| `/login` | current | Shared workforce login for platform owners, business owners, managers, and staff. |
| `/forgot-password` | current | Request a workforce password-reset email. |
| `/auth/callback` | hidden/internal | Exchange Supabase invitation codes for a persistent session. |
| `/auth/recovery` | hidden/internal | Exchange a Supabase password-recovery code and open the password form. |
| `/auth/update-password` | hidden/internal | Set a password after an invitation or recovery link. |
| `/auth/continue` | hidden/internal | Redirect an authenticated user to the appropriate workspace. |
| `/access` | current | Choose among multiple authorized businesses or locations. |
| `/unauthorized` | hidden/internal | Explain a denied workforce-route request. |
| `/dev/access` | development only | Localhost-only role and tenant switcher. |

## Business Owner

| Route | Status | Purpose |
| --- | --- | --- |
| `/businesses/[businessSlug]/admin` | hidden/internal | Business-owner landing page and navigation hub for catalog, specials, media, orders, and storefront preview. |
| `/businesses/[businessSlug]/admin/catalog` | hidden/internal | Product Catalog workspace for products, categories, variants, and reusable modifiers. |
| `/businesses/[businessSlug]/admin/media` | hidden/internal | Tenant-scoped media library for uploads, imports, metadata, and product images. |
| `/businesses/[businessSlug]/admin/specials` | hidden/internal | List and manage reusable specials and discounts. |
| `/businesses/[businessSlug]/admin/specials/new` | hidden/internal | Create a special. |
| `/businesses/[businessSlug]/admin/specials/[specialId]` | hidden/internal | Edit a tenant-owned special. |
| `/businesses/[businessSlug]/admin/employees` | hidden/internal | Manage Employees page for employee details, one business role, multiple assigned locations, and permissions shared across those locations. |

### Product Catalog

| Route | Status | Purpose |
| --- | --- | --- |
| `/businesses/[businessSlug]/admin/catalog/products` | hidden/internal | Product-management hub. |
| `/businesses/[businessSlug]/admin/catalog/products/categories` | hidden/internal | Create and edit top-level product categories. |
| `/businesses/[businessSlug]/admin/catalog/products/subcategories?categoryId=[categoryId]` | hidden/internal | Manage subcategories for a selected category. |
| `/businesses/[businessSlug]/admin/catalog/products/list` | hidden/internal | Browse and manage products. |
| `/businesses/[businessSlug]/admin/catalog/products/new` | hidden/internal | Create a product. |
| `/businesses/[businessSlug]/admin/catalog/products/[productId]` | hidden/internal | Edit a tenant-owned product. |
| `/businesses/[businessSlug]/admin/catalog/products/variant-groups` | hidden/internal | Manage reusable variant groups. |
| `/businesses/[businessSlug]/admin/catalog/products/variant-groups/[groupId]` | hidden/internal | Manage options in a reusable variant group. With `productId`, manage product-specific overrides. |
| `/businesses/[businessSlug]/admin/catalog/products/variant-assignments?productId=[productId]` | hidden/internal | Assign reusable variant groups to a product. |
| `/businesses/[businessSlug]/admin/catalog/products/modifier-groups?productId=[productId]` | hidden/internal | Assign reusable modifier groups and included/default rules to a product. |
| `/businesses/[businessSlug]/admin/catalog/products/modifier-groups/[groupId]/availability?productId=[productId]` | hidden/internal | Manage variant-specific modifier availability and pricing. |

### Modifier Library

The primary drill-down is Modifier Library → Category → Modifier Group → List → Option.

| Route | Status | Purpose |
| --- | --- | --- |
| `/businesses/[businessSlug]/admin/catalog/modifiers` | hidden/internal | Reusable Modifier Library entry point. |
| `/businesses/[businessSlug]/admin/catalog/modifiers/groups` | hidden/internal | Browse modifier categories. |
| `/businesses/[businessSlug]/admin/catalog/modifiers/groups/[categoryId]` | hidden/internal | Manage modifier groups in one category. |
| `/businesses/[businessSlug]/admin/catalog/modifiers/[groupId]` | hidden/internal | Manage lists in one modifier group. With `productId`, preserve product override context. |
| `/businesses/[businessSlug]/admin/catalog/modifiers/[groupId]/subgroups/[subgroupId]` | hidden/internal | Manage options in one modifier list. With `productId`, preserve product override context. |
| `/businesses/[businessSlug]/admin/catalog/modifiers/categories` | hidden/internal | Direct modifier-category management screen. |
| `/businesses/[businessSlug]/admin/catalog/modifiers/subgroups` | hidden/internal | Aggregate modifier-list management screen. |
| `/businesses/[businessSlug]/admin/catalog/modifiers/options` | hidden/internal | Aggregate modifier-option management screen. |

## Public Customer Routes

| Route | Status | Purpose |
| --- | --- | --- |
| `/` | current | Public application entry page. |
| `/businesses/[businessSlug]` | current | Tenant storefront landing page. |
| `/businesses/[businessSlug]/menu` | current | Tenant customer menu and setup-mode preview. |
| `/businesses/[businessSlug]/specials` | current | Tenant customer specials page. |
| `/businesses/[businessSlug]/checkout` | current | Tenant checkout using the selected business and default location. |
| `/businesses/[businessSlug]/orders/[orderNumber]` | current | Customer-safe order status page. |
| `/menu` | review pending | Seeded-demo customer menu retained until public-route review. |
| `/checkout` | review pending | Seeded-demo checkout retained until public-route review. |

## Staff Routes

These routes are intentionally retained for the next staff-access review.

| Route | Status | Purpose |
| --- | --- | --- |
| `/businesses/[businessSlug]/locations/[locationSlug]/manager` | hidden/internal | Location manager dashboard and entry point. Catalog editing remains disabled until permissions are defined. |
| `/businesses/[businessSlug]/locations/[locationSlug]/manager/orders` | hidden/internal | Manager order queue for the assigned business location. |
| `/businesses/[businessSlug]/locations/[locationSlug]/manager/availability` | hidden/internal | Location-specific temporary sold-out controls for products. |
| `/businesses/[businessSlug]/locations/[locationSlug]/manager/modifier-availability` | hidden/internal | Location-specific temporary sold-out controls for toppings and other modifier options. |
| `/businesses/[businessSlug]/locations/[locationSlug]/orders` | current | Tenant/location-scoped staff order queue. |
| `/staff/orders` | review pending | Seeded-demo staff queue pending staff route and access review. |

## Planned Routes

| Route | Status | Purpose |
| --- | --- | --- |
| `/businesses/[businessSlug]/boards/[boardSlug]` | future/planned | Business-scoped fullscreen digital menu board. |
| `/businesses/[businessSlug]/locations/[locationSlug]/boards/[boardSlug]` | future/planned | Location-scoped fullscreen digital menu board. |
| `/businesses/[businessSlug]/admin/locations/[locationSlug]` | future/planned | Explicit location settings, subject to the staff/admin access review. |

## Removed Route Families

The following route families no longer exist and must not be generated:

- Unscoped `/admin` and `/admin/*`.
- Pre-catalog `/businesses/[businessSlug]/admin/products/*`.
- Pre-catalog `/businesses/[businessSlug]/admin/modifiers/*`.

Use the business-scoped `/businesses/[businessSlug]/admin/catalog/*` routes for all catalog administration.
