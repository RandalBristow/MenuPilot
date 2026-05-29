# MenuPilot Project State

_Last updated: 2026-05-29_

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

## Current Progress Summary

| Area | Status | Notes |
|---|---|---|
| Product vision | Locked | Broad platform direction remains intact |
| Tech stack | Locked | Next.js, Supabase, shadcn, Stripe planned |
| Public menu | Working demo | Uses seeded Pronto Demo records |
| Product configurator | Working | Variants, modifiers, included credits, variant-specific modifier availability/pricing, cart flow |
| Cart | Working | Provider, sheet, summary bar, localStorage |
| Checkout | Working demo | Server-side cart validation/repricing creates unpaid pickup orders; transaction/RPC still needed |
| Staff orders | Working demo | Queue and status updates exist |
| Admin dashboard | Working demo | Modifier access moved under product management |
| Product admin | Working | Categories, subcategories, products, Media Library image selection, variant groups, assignments |
| Variant admin | Working | Reusable groups/options and per-product overrides |
| Modifier admin | In progress | Hierarchy standardized as Modifier Category -> Modifier Group -> Modifier Option Group -> Modifier Option |
| Media Library | Working demo | `/admin/media` manages `media_assets`; products reference images through `image_media_id` |
| Product modifier assignments | In progress | Attach/detach, option overrides, variant availability, and variant price overrides exist |
| Auth/roles | Planned | Admin/staff routes are not protected yet |
| Payments | Planned | Stripe selected but not implemented |
| Website builder | Future | Scoped conceptually |
| Theme system | Future | Scoped conceptually |

## Current Routes At A Glance

- `/` public entry page
- `/menu` customer menu
- `/checkout` pickup checkout
- `/staff/orders` staff order queue
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
- Public data access should be reviewed after auth and RLS are tightened.
- Mobile admin pages need continued 320px-430px visual checks as forms and list density evolve.

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

### 2026-05-06

- Created initial project state document.
- Recorded locked architecture decisions from planning conversation.
