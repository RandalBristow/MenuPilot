# MenuPilot Project State

_Last updated: 2026-06-06_

## Purpose

This file is project memory for MenuPilot. It records the locked direction, current implementation state, known gaps, and newer decisions that were not part of the original design.

## Application Name

### MenuPilot
**Status:** LOCKED

MenuPilot is the working product name. It describes control over menus, ordering, websites, locations, and restaurant operations without sounding overly technical.

## Product Definition

### Application Type
**Status:** LOCKED

A multi-business, multi-location restaurant/carryout platform combining:

- customizable public websites
- online ordering
- pickup and delivery
- payments
- staff order management
- admin menu management
- product configuration
- website/page builder
- theme system
- printed menu builder
- in-store display panels

The design direction remains:

> Shopify storefront + Toast-style operations + Webflow-lite structured builder.

## Global Project Rules

### Professional structure
**Status:** LOCKED

Use a feature-first structure. Routes, features, shared UI, infrastructure code, database migrations, and documentation each need a clear home.

### If built twice, extract it
**Status:** LOCKED

Do not over-abstract too early. Build the first version locally. If the same pattern/component/function is needed a second time, extract it.

### Locked means deliberate change only
**Status:** LOCKED

Any section marked `LOCKED` should not be changed without explaining why, documenting the new decision, and updating project memory.

### Mobile-first, device-agnostic design
**Status:** LOCKED

The application must work intentionally across mobile, tablet, desktop, and future display panels. Mobile is the primary design target. Desktop is an enhancement, not the baseline.

## Technology Decisions

### Frontend
**Status:** LOCKED

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui and Radix primitives

### Backend
**Status:** LOCKED

- Supabase
- Postgres
- Supabase Auth
- Supabase Storage
- Supabase Realtime where useful

### Payments
**Status:** LOCKED

- Stripe

## Core Architecture Decisions

### Multi-business and multi-location support
**Status:** LOCKED

The platform must support multiple businesses and multiple locations per business. Menus, users, payment settings, delivery rules, displays, hours, and availability may be business-wide or location-specific.

One shared multi-tenant database is expected. Business-owned records use `business_id`; location-specific records use `location_id` where appropriate. Businesses should not each get a separate database by default. A future Platform Admin / App Owner area will manage business and location onboarding.

Before a clean database rebuild, the app needs tenant-aware routing/context resolution so public menu, checkout, staff, and admin queries can use a Platform Admin-created business/location instead of seeded demo slugs. Tenant context should resolve business slug/id and location slug/id centrally. Initial tenant resolver helpers now exist, `/businesses/[businessSlug]` serves a tenant-scoped storefront landing page, `/businesses/[businessSlug]/menu` serves tenant-scoped public menus, `/businesses/[businessSlug]/checkout` serves tenant-scoped checkout, `/businesses/[businessSlug]/locations/[locationSlug]/orders` serves tenant/location-scoped staff orders, `/businesses/[businessSlug]/admin` provides a tenant-aware business admin shell, `/businesses/[businessSlug]/admin/products...` has business-scoped product read queries plus core product mutations, `/businesses/[businessSlug]/admin/modifiers...` has business-scoped reusable modifier library reads/writes, and `/businesses/[businessSlug]/admin/media` has business-scoped media reads/writes/uploads/imports.

### Product Configuration Engine
**Status:** LOCKED

Do not build a pizza-only engine. Build a generic product configuration engine that supports pizza, wings, subs, salads, coffee, drinks, and other configurable products.

The engine supports or is designed to support:

- product variants
- modifier groups
- modifier options
- price rules
- availability rules
- dependency rules
- default included modifiers
- swappable included modifier credits
- placement options
- quantity/multiplier options
- related add-ons
- location overrides

### Product variants
**Status:** LOCKED

Size/count/portion/weight choices are product variants, not ordinary modifiers. Reusable variant groups are defined globally, attached to products, and customized per product through overrides.

### Modifiers
**Status:** UPDATED 2026-05-29

Modifiers represent configurable product options such as toppings, crust type, crust style, sauce, dressing, bread, cheese, or preparation choices.

The current hierarchy is:

- Modifier Category = admin organization layer backed by `modifier_categories`.
- Modifier Group = product-attached rule set backed by `modifier_groups`.
- Modifier Option Group = subgroup/bucket inside a Modifier Group, such as Meats, Veggies, or Cheeses, backed by `modifier_option_groups`.
- Modifier Option = actual selectable choice, such as Pepperoni, Ranch, or Gluten Free, backed by `modifier_options`.

Modifier behavior should mirror variant behavior:

- Reusable modifier structures are defined globally.
- Products attach reusable Modifier Groups through `product_modifier_groups`.
- Products do not attach Modifier Categories.
- Products do not attach Modifier Option Groups directly.
- Products do not attach individual Modifier Options directly except through product-specific override/availability systems.
- Product-specific differences live in override tables.
- Per-product modifier option overrides currently support price delta, prep time delta, enabled state, and sort order.
- Variant-specific modifier option availability is managed per product, reusable variant option, Modifier Group, and Modifier Option.
- Variant-specific modifier option price overrides are managed per product, reusable variant option, Modifier Group, and Modifier Option.
- Modifier Categories are for admin organization only.
- Modifier Option Groups organize options inside a Modifier Group.
- Modifier Options should belong to a Modifier Option Group/List; ungrouped options are not the intended admin/customer data shape.
- Modifier Option Group/List `sort_order` is scoped within the parent Modifier Group and controls builder display order for grouped options.
- Modifier Group `sort_order` is scoped within the parent Modifier Category and controls builder section order.

### Conditional modifier availability
**Status:** PARTIALLY IMPLEMENTED

Variant-specific modifier option availability is implemented through `product_variant_modifier_option_availability_rules` and runtime filtering. Selected modifier options are removed if they become unavailable after a variant change.

Location-specific and selected-option dependency availability remain planned.

### Variant-specific modifier pricing
**Status:** IMPLEMENTED

Variant-specific modifier option price overrides are implemented through `product_variant_modifier_option_price_overrides`. Pricing priority is:

1. enabled variant-specific modifier option price override
2. product-specific `product_modifier_option_overrides.price_delta_override`
3. global `modifier_options.price_delta`

Disabled product-specific modifier option overrides make the option unavailable. Disabled variant-specific price overrides are ignored and fall back to inherited pricing.

### Included modifier credits
**Status:** PARTIALLY IMPLEMENTED

Included topping credits and multiplier-aware included pricing are implemented for the current configurator. Broader admin editing for included/default modifier rules remains future work.

### Configurable product pricing
**Status:** UPDATED 2026-06-01

All configurable product pricing must go through the shared `priceConfiguredProduct` helper in `lib/pricing/price-configured-product.ts`.

Builders should not implement independent pricing math. PizzaBuilder, StandardItemBuilder, and future builder templates should pass their selected effective variant, effective modifier groups/options, selected modifiers, default modifier records, and quantity into the shared helper.

Checkout must remain server-authoritative, but it should use the same pricing helper after validating server-loaded product, variant, modifier, availability, placement, and multiplier rules. Client-submitted prices are snapshots only and must not be trusted.

Pricing order is:

1. selected variant price determines the product base price
2. enabled variant-specific modifier option price override
3. product-specific modifier option price override
4. global modifier option price
5. included modifier group rules after effective modifier prices are known
6. quantity multiplies the resolved unit price

Default modifier selections are selected modifiers and consume included selection slots.

Business-level pizza half-topping settings are stored in
`business_pricing_settings`. Missing settings rows use these defaults:
half-topping pricing enabled, half-toppings consume half an included slot, and
rounding mode `floor_to_cent`. Pizza left/right placement uses weight `0.5`;
whole placement uses weight `1.0`; effective weight is placement weight times
multiplier. Half-topping rounding floors after placement weight and multiplier
are applied. Non-pizza builders must not receive half-placement discounts unless
the shared pricing resolver is intentionally called with pizza behavior.

### Builder templates
**Status:** UPDATED 2026-06-04

The database-supported builder templates are `standard`, `pizza`, `wings`, `sub`, `salad`, `drink`, and `combo`.

Current runtime routing is:

1. `pizza` -> PizzaBuilder, which remains custom for pizza-specific placement, included toppings, defaults, size-based topping pricing, and pizza UX.
2. Non-pizza products with assigned/effective Modifier Groups -> GenericConfigurableBuilder for salads, subs, wings, pasta, coffee, appetizers, kids meals, and similar modifier-driven products.
3. Variant-only or quantity-only products without Modifier Groups -> SimpleProductBuilder for drinks, chips, desserts, extra sauce cups, simple sides, and similar products.
4. `combo` -> unsupported/future BundleBuilder / ComboBuilder for specials, combos, meal deals, and multi-product offers.

Builder behavior and builder presentation should stay separate. `builder_template` describes product behavior/type. A future `builder_layout` should describe presentation, while theme controls colors, fonts, spacing, and brand feel. All builder layouts must share the same pricing engine and server validation.

Future builder layout variants are presentation only. Possible layouts include compact accordion, visual card/Domino's-style, and step-by-step flows. Do not create separate pricing, validation, cart, or checkout logic per layout.

See `project-docs/ROADMAP.md` for the current roadmap, product entry regression matrix, and deferred future layers.

## Current Progress Summary

| Area | Status | Notes |
|---|---|---|
| Product vision | Locked | Broad platform direction remains intact |
| Tech stack | Locked | Next.js, Supabase, shadcn, Stripe planned |
| Public storefront/menu | Tenant route started | `/businesses/[businessSlug]` is the selected business storefront landing page. `/businesses/[businessSlug]/menu` loads the selected business menu and guards nested products/media by business. Legacy `/menu` still loads seeded Pronto Demo via `pronto-demo`. |
| Product configurator | Working | ProductConfigurator resolves builder modes to PizzaBuilder, GenericConfigurableBuilder, SimpleProductBuilder, or unsupported future combo handling; variants, modifiers, included credits, variant-specific modifier availability/pricing, cart flow |
| Cart | Working | Provider, sheet, summary bar, localStorage |
| Checkout | Tenant route started | Legacy `/checkout` still resolves Pronto Demo/main-street. `/businesses/[businessSlug]/checkout` resolves the business and default location, validates active/orderable status, rejects cross-tenant carts, and uses server-side cart validation/repricing before creating unpaid pickup orders. Transaction/RPC still needed. |
| Staff orders | Tenant route started | Legacy `/staff/orders` still resolves Pronto Demo/main-street. `/businesses/[businessSlug]/locations/[locationSlug]/orders` resolves business/location context, filters reads by `business_id` and `location_id`, and verifies order ownership before status updates. |
| Admin dashboard | Working demo | Modifier access moved under product management |
| Platform Admin | Started | `/platform`, `/platform/businesses`, `/platform/businesses/new`, and `/platform/businesses/[businessId]` list, create, inspect, and activate businesses/locations; business detail links to tenant admin shell; auth protection remains future |
| Tenant admin context | Started | `features/tenant` resolves business/location context and `/businesses/[businessSlug]/admin` shows the selected business context, default-location orderability, pizza pricing settings, setup sections for Product Catalog, Variants, Modifiers, Media, Customer Preview, and Locations / Orders when a location exists; tenant-scoped Product Admin, reusable Modifier Library, Media Library, public menu reads, business-scoped checkout, and location-scoped staff orders exist. |
| Product admin | Working | Legacy `/admin/products...` remains working for demo scope. Tenant-scoped `/businesses/[businessSlug]/admin/products...` supports business-scoped product reads, core product actions, category/subcategory saves, reusable variant saves, product variant assignment/override saves, product Modifier Group assignment/included/default saves, and variant-specific modifier availability/price rule saves. |
| Variant admin | Working | Reusable groups/options and per-product overrides |
| Modifier admin | Working | Hierarchy standardized as Modifier Category -> Modifier Group -> Modifier Option Group -> Modifier Option. Legacy `/admin/modifiers...` remains demo-scoped; `/businesses/[businessSlug]/admin/modifiers...` uses selected business context for reusable modifier library reads/writes. |
| Media Library | Working | Legacy `/admin/media` remains demo-scoped. `/businesses/[businessSlug]/admin/media` lists, uploads, imports, and edits media for the selected business; storage paths use selected `business_id`. Products reference images through `image_media_id`. |
| Product modifier assignments | In progress | Attach/detach, option overrides, variant availability, and variant price overrides exist |
| Auth/roles | Planned | Admin/staff routes are not protected yet |
| Payments | Planned | Stripe selected but not implemented |
| Website builder | Future | Scoped conceptually |
| Theme system | Future | Scoped conceptually |
| Roadmap | Current | `ROADMAP.md` records near-term order, builder-mode foundation, platform onboarding, clean database rebuild, specials, versioning, printable menus, and deferred AI work |
| Product entry regression | In progress | `PRODUCT_ENTRY_REGRESSION_MATRIX.md` records code-path audit coverage and the remaining manual admin-to-staff verification checklist |
| Tenant onboarding regression | Ready for manual pass | `TENANT_ONBOARDING_REGRESSION.md` records the final new-business browser checklist before deciding whether to wipe/rebuild the development database |

## Current Routes At A Glance

- `/` public entry page
- `/menu` customer menu for the legacy Pronto Demo business
- `/businesses/[businessSlug]` tenant-scoped storefront landing page
- `/businesses/[businessSlug]/menu` tenant-scoped public menu preview/customer entry
- `/checkout` pickup checkout
- `/businesses/[businessSlug]/checkout` tenant-scoped checkout using the business default location
- `/staff/orders` staff order queue
- `/businesses/[businessSlug]/locations/[locationSlug]/orders` tenant/location-scoped staff order queue
- `/platform` internal Platform Admin hub
- `/platform/businesses` internal Platform Admin business list
- `/platform/businesses/new` internal Platform Admin create-business and first-location form
- `/platform/businesses/[businessId]` internal Platform Admin business/location detail
- `/businesses/[businessSlug]/admin` tenant-aware business setup landing page
- `/businesses/[businessSlug]/admin/products...` tenant-scoped product admin shells with core product mutations
- `/businesses/[businessSlug]/admin/modifiers...` tenant-scoped reusable modifier library management
- `/businesses/[businessSlug]/admin/media` tenant-scoped media library management
- `/admin` admin hub
- `/admin/media` media library
- `/admin/products` product management hub
- `/admin/products/list` products browser
- `/admin/products/new` create product
- `/admin/products/[productId]` edit product
- `/admin/products/categories` product categories
- `/admin/products/subcategories` product subcategories
- `/admin/products/variant-groups` reusable variant groups
- `/admin/products/variant-groups/[groupId]` variant group options
- `/admin/products/variant-assignments?productId=...` product-scoped variant assignment browser entered from Product cards
- `/admin/products/modifier-groups` product modifier assignment browser
- `/admin/products/modifier-groups/[groupId]/availability?productId=...` product-scoped Modifier Group variant availability and pricing rules
- `/admin/modifiers/groups` Modifier Categories displayed as the current Modifier Groups entry point
- `/admin/modifiers/groups/[categoryId]` Modifier Groups for one Modifier Category
- `/admin/modifiers/[groupId]` Modifier Option Groups for one Modifier Group
- `/admin/modifiers/[groupId]/subgroups/[subgroupId]` Modifier Options for one Modifier Option Group
- `/admin/modifiers/subgroups` legacy/global Modifier Group management screen
- `/admin/modifiers/options` legacy/global Modifier Option management screen

## Known Problems and Current Solutions

### Same variant or modifier has different values per product
**Solution:** Define reusable objects globally, attach them to products, and store product-specific changes in override tables.

### Modifier availability depends on selected size
**Solution:** Use variant-based modifier option availability rules and filter options at configuration time.

### Modifier prices depend on selected size
**Solution:** Use variant-specific modifier option price overrides and apply them after product-specific modifier option price overrides are inherited.

### Gluten-free crust should not be a fake size
**Solution:** Keep size as a variant. Use crust type as a modifier filtered by selected size.

### Included toppings should not be charged again when removed and re-added
**Solution:** Use default modifiers plus included swappable modifier credits.

### Admin modifier terminology was confusing
**Solution:** Standardize terminology around the database layers: `modifier_categories` are Modifier Categories for admin organization, `modifier_groups` are product-attached Modifier Groups, `modifier_option_groups` are Modifier Option Groups, and `modifier_options` are Modifier Options.

## High-Risk Gaps

- Order creation should become transactional before real payment use.
- Admin and staff routes need auth/role protection.
- Platform Admin routes are not auth-protected yet and should not be publicly exposed.
- Platform/Tenant Admin can manage business and location activation state, but this remains internal until auth/role protection exists.
- Legacy demo routes still depend on seeded Pronto Demo/main-street records for compatibility. Tenant-scoped public menu, checkout, staff orders, business admin, Product Admin, reusable Modifier Library, and Media Library routes now exist; remaining follow-up is deciding when to retire or redirect legacy demo routes before the clean database rebuild.
- New-tenant manual regression must pass using `TENANT_ONBOARDING_REGRESSION.md` before wiping/rebuilding the development database.
- Public data access should be reviewed after auth and RLS are tightened.
- Mobile admin pages need continued 320px-430px visual checks as forms and list density evolve.
- Draft/publish versioning, billing/subscriptions, AI Owner Copilot, multiple builder visual layouts, BundleBuilder/ComboBuilder, and printable menu builder are intentionally deferred.
- Specials should wait until builder mode foundation and product entry regression testing are complete.
- Product entry regression audit found no code blocker, but Specials should wait until manual browser verification passes for pizza, Chicken Salad, drink with variants, simple item, extra sauce, sub with modifiers, and wings with count/sauce.
- Product setup warns, without blocking save, when default selected modifier options exceed included selections for that Modifier Group. Defaults consume included slots and should not be treated as magic-free.

## Change Log

### 2026-05-19

- Updated project state to reflect checkout, staff orders, admin products, reusable variants, and the redesigned modifier hierarchy.
- Recorded the initial modifier hierarchy redesign.
- Recorded product-level modifier option overrides and variant-specific modifier availability as current implementation work.

### 2026-05-23

- Standardized modifier terminology: Modifier Category, Modifier Group, Modifier Option Group, and Modifier Option.
- Clarified that products attach Modifier Groups only; categories and option groups are organizational layers.

### 2026-05-29

- Recorded server-side checkout validation and repricing as implemented.
- Recorded Media Library product image selection through `media_assets` and `products.image_media_id`.
- Recorded variant-specific modifier option availability and price override flows.
- Recorded explicit builder template routing for standard, pizza, wings, sub, salad, drink, and future combo/bundle products.

### 2026-05-06

- Created initial project state document.
- Recorded locked architecture decisions from planning conversation.

### 2026-06-04

- Added `ROADMAP.md` as the current roadmap and future architecture decision record.
- Recorded Builder Mode Foundation as implemented: PizzaBuilder, GenericConfigurableBuilder, SimpleProductBuilder, and future BundleBuilder/ComboBuilder.
- Recorded shared multi-tenant database and Platform Admin onboarding decisions.
- Added product entry regression matrix audit and manual verification gate before Specials Engine.

### 2026-06-05

- Added minimal Platform Admin onboarding schema support for business contact fields, location status, and setup-safe defaults.
- Added internal Platform Admin list/detail pages for reviewing businesses, locations, setup state, and ordering flags.
- Added internal Platform Admin create-business and first-location form. New records start in setup mode; first locations start disabled and not accepting orders. New businesses also get a default `Main Menu` for product category setup.
- Reconciled roadmap docs around Platform Admin business context, tenant-aware routing before clean rebuild, product setup warnings, builder UI polish, future versioning/print menu/AI sequencing, and deferred work.
- Added tenant resolver helpers and the `/businesses/[businessSlug]/admin` shell. Platform Admin business detail can open the selected business admin context; Product Admin core product mutations, category/subcategory saves, reusable variant saves, product variant assignment/override saves, product Modifier Group assignment/included/default saves, and variant-specific modifier availability/price saves now work under `/businesses/[businessSlug]/admin/products...`.
- Added tenant-scoped reusable Modifier Library routes/actions under `/businesses/[businessSlug]/admin/modifiers...` for Modifier Categories, Modifier Groups, Modifier Option Groups, Modifier Options, safe option/list deletes, option moves, and product modifier option overrides reached from modifier detail pages. Legacy `/admin/modifiers...` remains demo-scoped.
- Added tenant-scoped Media Library route/actions under `/businesses/[businessSlug]/admin/media`. Media reads, uploads, URL imports, and metadata edits resolve `businessSlug` server-side, write selected `business_id`, and store files under the selected business id path. Legacy `/admin/media` remains demo-scoped. Public menu, checkout, and staff tenant conversion remain pending.
- Added tenant-scoped public menu route `/businesses/[businessSlug]/menu`. The legacy `/menu` route remains pointed at `pronto-demo`. Scoped menu reads filter nested products and media to the resolved business, setup businesses show preview messaging, and setup menus disable customer ordering actions while checkout tenant conversion remains pending.
- Reorganized the tenant admin landing page into Product Catalog, Variants, Modifiers, Media, Customer Preview, and Future / Not Ready sections. The page now explains reusable variant/modifier setup before product-specific assignment and keeps Specials plus Locations / Orders disabled until later tenant-aware flows.
- Added business-scoped checkout route `/businesses/[businessSlug]/checkout`. Checkout resolves business/default location server-side, requires active/orderable business and location state, rejects cross-tenant carts, and keeps legacy `/checkout` on Pronto Demo/main-street.
- Added location-scoped staff order route `/businesses/[businessSlug]/locations/[locationSlug]/orders`. Staff reads and status updates resolve tenant context server-side, filter by business/location ownership, revalidate scoped paths, and keep legacy `/staff/orders` on Pronto Demo/main-street.
- Added Platform Admin activation controls on `/platform/businesses/[businessId]`. Platform Admin can set business status and location status/order flags; new tenants still start setup/disabled, and checkout requires active business plus active, enabled, accepting, pickup-or-delivery location state.
- Added Product Modifier Assignment pricing warnings when product default modifiers exceed included selections for the assigned Modifier Group. The warning is informational only; pricing remains centralized in `priceConfiguredProduct`.
- Added `TENANT_ONBOARDING_REGRESSION.md` as the final manual checklist for proving a Platform Admin-created business can be configured, activated, ordered from, and viewed in scoped staff orders without relying on `pronto-demo`.
- Added tenant-scoped storefront landing route `/businesses/[businessSlug]`. It resolves the selected business, shows storefront/orderability status, links to the scoped menu, and only links to checkout when the default location is orderable.
- Added defensive default-menu creation for product category/subcategory saves so Platform Admin-created businesses without an existing `Main Menu` can create their first product category.
- Clarified tenant Admin Modifier Subgroups / Option Group/List selection behavior: selecting a top-level Modifier Category shows its child subgroups and keeps the footer add/back actions available. If no child subgroup exists yet, the plus action creates one under the selected category; once a Modifier Group exists, option lists are managed inside that group.
