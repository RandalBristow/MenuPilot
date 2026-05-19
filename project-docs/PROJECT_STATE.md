# MenuPilot Project State

_Last updated: 2026-05-19_

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
**Status:** UPDATED 2026-05-19

Modifiers represent configurable product options such as toppings, crust type, crust style, sauce, dressing, bread, cheese, or preparation choices.

The current hierarchy is:

- `modifier_group_categories` = top-level Modifier Groups
- `modifier_groups` = Modifier Group Subgroups
- `modifier_option_groups` = option groups inside a subgroup
- `modifier_options` = selectable choices

Modifier behavior should mirror variant behavior:

- Reusable modifier structures are defined globally.
- Products attach reusable modifier subgroups through `product_modifier_groups`.
- Product-specific differences live in override tables.
- Per-product modifier option overrides currently support price delta, prep time delta, enabled state, and sort order.

### Conditional modifier availability
**Status:** PARTIALLY IMPLEMENTED

Variant-specific modifier option availability is implemented through `product_variant_modifier_option_availability_rules` and runtime filtering. Selected modifier options are removed if they become unavailable after a variant change.

Location-specific and selected-option dependency availability remain planned.

### Included modifier credits
**Status:** PARTIALLY IMPLEMENTED

Included topping credits and multiplier-aware included pricing are implemented for the current configurator. Broader admin editing for included/default modifier rules remains future work.

## Current Progress Summary

| Area | Status | Notes |
|---|---|---|
| Product vision | Locked | Broad platform direction remains intact |
| Tech stack | Locked | Next.js, Supabase, shadcn, Stripe planned |
| Public menu | Working demo | Uses seeded Pronto Demo records |
| Product configurator | Working | Variants, modifiers, included credits, cart flow |
| Cart | Working | Provider, sheet, summary bar, localStorage |
| Checkout | Working demo | Creates unpaid pickup orders; needs server-side price validation |
| Staff orders | Working demo | Queue and status updates exist |
| Admin dashboard | Working demo | Modifier access moved under product management |
| Product admin | Working | Categories, subcategories, products, variant groups, assignments |
| Variant admin | Working | Reusable groups/options and per-product overrides |
| Modifier admin | In progress | Hierarchy redesigned to group/category -> subgroup -> option group -> options |
| Product modifier assignments | In progress | Attach/detach and option overrides exist |
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
- `/admin/products` product management hub
- `/admin/products/list` products browser
- `/admin/products/new` create product
- `/admin/products/[productId]` edit product
- `/admin/products/categories` product categories
- `/admin/products/subcategories` product subcategories
- `/admin/products/variant-groups` reusable variant groups
- `/admin/products/variant-groups/[groupId]` variant group options
- `/admin/products/variant-assignments` product variant assignment browser
- `/admin/products/modifier-groups` product modifier assignment browser
- `/admin/modifiers/groups` top-level modifier groups
- `/admin/modifiers/groups/[categoryId]` modifier group subgroups
- `/admin/modifiers/[groupId]` option groups for one modifier subgroup
- `/admin/modifiers/[groupId]/subgroups/[subgroupId]` options for one option group
- `/admin/modifiers/subgroups` legacy/global subgroup management screen
- `/admin/modifiers/options` legacy/global option management screen

## Known Problems and Current Solutions

### Same variant or modifier has different values per product
**Solution:** Define reusable objects globally, attach them to products, and store product-specific changes in override tables.

### Modifier availability depends on selected size
**Solution:** Use variant-based modifier option availability rules and filter options at configuration time.

### Gluten-free crust should not be a fake size
**Solution:** Keep size as a variant. Use crust type as a modifier filtered by selected size.

### Included toppings should not be charged again when removed and re-added
**Solution:** Use default modifiers plus included swappable modifier credits.

### Admin modifier terminology was confusing
**Solution:** Treat `modifier_group_categories` as the top-level Modifier Groups page and `modifier_groups` as Modifier Group Subgroups.

## High-Risk Gaps

- Checkout totals are still trusted from the client flow more than they should be.
- Order creation should become transactional before real payment use.
- Admin and staff routes need auth/role protection.
- Public data access should be reviewed after auth and RLS are tightened.
- Mobile admin pages need continued 320px-430px visual checks as forms and list density evolve.

## Change Log

### 2026-05-19

- Updated project state to reflect checkout, staff orders, admin products, reusable variants, and the redesigned modifier hierarchy.
- Recorded the modifier hierarchy decision: `modifier_group_categories` are top-level Modifier Groups; `modifier_groups` are Modifier Group Subgroups.
- Recorded product-level modifier option overrides and variant-specific modifier availability as current implementation work.

### 2026-05-06

- Created initial project state document.
- Recorded locked architecture decisions from planning conversation.
