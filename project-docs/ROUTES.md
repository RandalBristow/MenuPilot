# Routes

_Last updated: 2026-06-06_

Status values:

- `current`: active route in the current product flow.
- `legacy/remove`: older route or compatibility route that should be removed or avoided.
- `future/planned`: planned route not implemented yet.
- `hidden/internal`: implemented route used by a workflow but not meant as a primary navigation destination.

## Public Pages

| Route | Status | Purpose |
| --- | --- | --- |
| `/` | current | Public entry page. |
| `/menu` | current | Legacy customer-facing menu and product configuration entry point for the seeded `pronto-demo` business. |
| `/businesses/[businessSlug]` | current | Tenant-scoped storefront landing page for a business. Links to the scoped menu, shows storefront/orderability status, and only shows checkout when the default location is orderable. |
| `/businesses/[businessSlug]/menu` | current | Tenant-scoped public menu route. Active businesses show normally; setup businesses show preview messaging with customer ordering actions disabled. |

## Checkout

| Route | Status | Purpose |
| --- | --- | --- |
| `/checkout` | current | Legacy pickup checkout flow for Pronto Demo/main-street. |
| `/businesses/[businessSlug]/checkout` | current | Tenant-scoped checkout using the selected business and deterministic default location. Blocks setup/inactive/non-orderable contexts and rejects cross-tenant carts. |

## Staff Orders

| Route | Status | Purpose |
| --- | --- | --- |
| `/staff/orders` | current | Legacy staff order queue for Pronto Demo/main-street. |
| `/businesses/[businessSlug]/locations/[locationSlug]/orders` | current | Tenant/location-scoped staff order queue. Resolves business/location from route slugs, filters reads by `business_id` and `location_id`, and verifies order ownership before status updates. |

## Admin Dashboard

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin` | current | Admin dashboard/navigation hub. Modifier management access lives under Product Management. |

## Platform Admin

Platform Admin is an internal app-owner area. Auth/role protection is deferred; do not expose these routes publicly.

Future Platform Admin business switching should open an explicit tenant admin context instead of relying only on local/session state. A route shape such as `/businesses/[businessSlug]/admin` is acceptable if chosen during implementation.

| Route | Status | Purpose |
| --- | --- | --- |
| `/platform` | hidden/internal | Platform Admin hub for app-owner business onboarding tools. |
| `/platform/businesses` | hidden/internal | Business list showing setup status, contact fields, location counts, first-location state, and a link to create a new business. |
| `/platform/businesses/new` | hidden/internal | Platform Admin create-business and first-location form. New businesses and locations start in setup mode; first locations start disabled and not accepting orders. |
| `/platform/businesses/[businessId]` | hidden/internal | Business detail page showing business contact/status fields, locations, ordering flags, setup warnings, and activation controls for business/location status and ordering flags. |
| `/businesses/[businessSlug]/admin` | hidden/internal | Tenant-aware business setup landing page opened from Platform Admin. Shows selected business context, default-location orderability, grouped links for Product Catalog, Variants, Modifiers, Specials, Media, Customer Preview, and Locations / Orders when a location exists. |

## Tenant Product Management

These routes are internal business-scoped route shells. They use the selected business slug for read queries, links, and converted product mutations. Core product create/update/delete/enable/duplicate actions, category/subcategory create/edit/enable-disable saves, reusable variant group/option saves, product variant assignment/override saves, product Modifier Group assignments, included modifier rules, default modifier selections, and variant-specific modifier availability/price rules are tenant-aware here.

| Route | Status | Purpose |
| --- | --- | --- |
| `/businesses/[businessSlug]/admin/products` | hidden/internal | Tenant-scoped Product Management hub. |
| `/businesses/[businessSlug]/admin/products/categories` | hidden/internal | Tenant-scoped product category management. Create/edit saves resolve the business server-side from `businessSlug`. |
| `/businesses/[businessSlug]/admin/products/subcategories` | hidden/internal | Tenant-scoped product subcategory management, usually with `categoryId`. Create/edit saves validate parent category and subcategory ownership. |
| `/businesses/[businessSlug]/admin/products/list` | hidden/internal | Tenant-scoped product browser. Product links remain in the scoped route family; new and duplicate core product writes are enabled. |
| `/businesses/[businessSlug]/admin/products/new` | hidden/internal | Tenant-scoped new product form. Create writes to the selected business. |
| `/businesses/[businessSlug]/admin/products/[productId]` | hidden/internal | Tenant-scoped product detail/edit shell. Product lookup and core product saves/duplicates are scoped by business. |
| `/businesses/[businessSlug]/admin/products/variant-groups` | hidden/internal | Tenant-scoped reusable variant group management. Create/edit saves resolve the business server-side from `businessSlug`. |
| `/businesses/[businessSlug]/admin/products/variant-groups/[groupId]` | hidden/internal | Tenant-scoped variant group option management and product-specific variant option overrides. Group, option, and product writes validate selected business ownership. |
| `/businesses/[businessSlug]/admin/products/variant-assignments` | hidden/internal | Tenant-scoped product variant assignment management. Select/detach writes validate product and variant group ownership. |
| `/businesses/[businessSlug]/admin/products/modifier-groups` | hidden/internal | Tenant-scoped product Modifier Group assignment management. Attach/detach and included-rule saves validate selected business ownership. |
| `/businesses/[businessSlug]/admin/products/modifier-groups/[groupId]/availability` | hidden/internal | Tenant-scoped Modifier Group variant rules management. Availability and variant-specific modifier price writes validate selected business ownership. |

## Tenant Modifier Management

These routes are internal business-scoped route shells for reusable modifier library management. They use the selected business slug for read queries, links, and converted modifier mutations. Legacy `/admin/modifiers...` remains demo-scoped for compatibility.

| Route | Status | Purpose |
| --- | --- | --- |
| `/businesses/[businessSlug]/admin/modifiers` | hidden/internal | Tenant-scoped Modifier Management hub. |
| `/businesses/[businessSlug]/admin/modifiers/categories` | hidden/internal | Tenant-scoped Modifier Category management. |
| `/businesses/[businessSlug]/admin/modifiers/groups` | hidden/internal | Tenant-scoped Modifier Category list displayed as the current Modifier Groups entry point. |
| `/businesses/[businessSlug]/admin/modifiers/groups/[categoryId]` | hidden/internal | Tenant-scoped Modifier Groups for one Modifier Category. Unknown/cross-tenant category IDs return not found. |
| `/businesses/[businessSlug]/admin/modifiers/[groupId]` | hidden/internal | Tenant-scoped Modifier Option Groups for one Modifier Group. With `productId`, this route keeps product-scoped override context. |
| `/businesses/[businessSlug]/admin/modifiers/[groupId]/subgroups/[subgroupId]` | hidden/internal | Tenant-scoped Modifier Options for one Modifier Option Group. With `productId`, this route keeps product-scoped override context. |
| `/businesses/[businessSlug]/admin/modifiers/subgroups` | hidden/internal | Tenant-scoped aggregate Modifier Option Group/List management screen. |
| `/businesses/[businessSlug]/admin/modifiers/options` | hidden/internal | Tenant-scoped aggregate Modifier Option management screen. |

## Media Library

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/media` | current | Media Library for managing image assets in `media_assets`; product images are selected from here through `products.image_media_id`. |
| `/businesses/[businessSlug]/admin/media` | hidden/internal | Tenant-scoped Media Library. Reads, uploads, URL imports, metadata edits, and storage paths use the selected business. |

## Tenant Specials Management

These routes are internal business-scoped route shells for reusable Specials MVP management. Expired specials remain visible and reusable; checkout only applies currently eligible enabled specials.

| Route | Status | Purpose |
| --- | --- | --- |
| `/businesses/[businessSlug]/admin/specials` | hidden/internal | Tenant-scoped Specials Admin list. Shows enabled state, computed lifecycle status, eligibility summary, schedule summary, and enable/disable/edit actions. |
| `/businesses/[businessSlug]/admin/specials/new` | hidden/internal | Tenant-scoped create-special form for line discounts, fixed-price line specials, cart discounts, eligibility, date range, and recurring day/time availability. |
| `/businesses/[businessSlug]/admin/specials/[specialId]` | hidden/internal | Tenant-scoped edit-special form. Cross-tenant special IDs return not found or are rejected by server-side actions. |

## Product Management

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/products` | current | Product Management hub. |
| `/admin/products/categories` | current | Product category management. Category cards link to subcategory management for that category. |
| `/admin/products/subcategories` | current | Product subcategory management, usually entered with `categoryId` query context. |
| `/admin/products/list` | current | Product browser and product row actions. |
| `/admin/products/new` | current | Create product page. |
| `/admin/products/[productId]` | current | Edit product page. |
| `/admin/products/modifier-groups` | current | Product-to-Modifier Group assignment and per-product Modifier Option override flow. |
| `/admin/products/modifier-groups/[groupId]/availability` | hidden/internal | Product-scoped Modifier Group variant rules page for availability and variant-specific modifier option price overrides. Use with `productId`. |
| `/admin/products/variants` | legacy/remove | Removed from active navigation. Old product-specific variant route replaced by reusable Variant Groups and `/admin/products/variant-assignments`. Do not use for new work. |

## Reusable Variant Groups

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/products/variant-groups` | current | Reusable variant group management. |
| `/admin/products/variant-groups/[groupId]` | current | Variant options for one reusable variant group. With `productId`, this route is used for product-specific variant option overrides or preview. |

## Variant Assignments

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/products/variant-assignments` | hidden/internal | Product-to-variant-group assignment route. This is not a Product Management hub card; enter it from a Product card with `productId` context. |
| `/admin/products/variant-assignments?productId=...` | hidden/internal | Product-scoped entry from a Product card for assigning reusable variant groups and managing product-specific variant overrides. |

## Modifier Management

Modifier terminology:

- Modifier Category: admin organization layer backed by `modifier_categories`.
- Modifier Group: product-attached rule set backed by `modifier_groups`.
- Modifier Option Group: bucket/list inside a Modifier Group backed by `modifier_option_groups`.
- Modifier Option: selectable customer choice backed by `modifier_options`.

Products attach Modifier Groups. Products do not attach Modifier Categories or Modifier Option Groups directly. Products do not attach individual Modifier Options directly except through product-specific override/availability systems.

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/modifiers` | legacy/remove | Modifier management landing/compatibility route. Product Management is the current entry point. |
| `/admin/modifiers/groups` | current | Modifier Category list displayed as the current Modifier Groups entry point. |
| `/admin/modifiers/groups/[categoryId]` | current | Modifier Groups for one Modifier Category. |
| `/admin/modifiers/[groupId]` | current | Modifier Option Groups for one Modifier Group. With `productId`, this route is product-scoped and returns to product modifier assignments. |
| `/admin/modifiers/[groupId]/subgroups/[subgroupId]` | current | Modifier Options for one Modifier Option Group. With `productId`, this route is product-scoped for per-product Modifier Option overrides. |
| `/admin/modifiers/categories` | legacy/remove | Older direct Modifier Category management screen. The current flow starts at `/admin/modifiers/groups`. |
| `/admin/modifiers/subgroups` | legacy/remove | Older aggregate Modifier Group screen with filters. Use the current drill-down flow instead. |
| `/admin/modifiers/options` | legacy/remove | Older aggregate Modifier Option screen. Use the current drill-down flow instead. |

## Hidden/Internal Workflow Routes

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/products/subcategories?categoryId=...` | hidden/internal | Category-scoped subcategory management entry from a Product Category card. |
| `/admin/products/modifier-groups?productId=...` | hidden/internal | Product-scoped Modifier Group assignment entry from a Product card. |
| `/admin/products/modifier-groups/[groupId]/availability?productId=...` | hidden/internal | Product-scoped Variant Rules page for one assigned Modifier Group. Manages availability and price overrides per selected reusable variant option. |
| `/admin/products/variant-groups/[groupId]?productId=...` | hidden/internal | Product-scoped variant option override/preview route. |
| `/admin/modifiers/[groupId]?productId=...` | hidden/internal | Product-scoped Modifier Option Group list. |
| `/admin/modifiers/[groupId]/subgroups/[subgroupId]?productId=...` | hidden/internal | Product-scoped Modifier Option override list. |

## Future/Planned Admin Routes

| Route | Status | Purpose |
| --- | --- | --- |
| `/businesses/[businessSlug]/admin/locations/[locationSlug]` | future/planned | Explicit location-scoped admin settings context if location admin stays under the business admin route family. Exact route shape may change. |
| `/admin/settings` | future/planned | Business and admin settings. |
| `/admin/theme` | future/planned | Brand and theme management. |
| `/admin/pages` | future/planned | Page/content management. |
| `/admin/specials` | future/planned | Specials Engine admin after product entry foundation and builder modes are stable. |
| `/admin/print-menus` | future/planned | Printable Menu Builder using product/category/special data from the same source of truth. |
| `/admin/inventory` | future/planned | Inventory management. |
| `/admin/orders` | future/planned | Admin order management and history. |

## Deferred Route Families

These route families are intentionally not current product-entry work:

- Full draft/publish/versioning screens.
- Billing/subscription screens.
- AI Owner Copilot screens.
- Multiple builder visual layout configuration screens.
- BundleBuilder/ComboBuilder customer/admin flows.
- Customer-facing AI.
