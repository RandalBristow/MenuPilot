# MenuPilot Project State

_Last updated: 2026-05-06_

## Purpose

This file is the project memory for the MenuPilot app. It records the scope, major architecture decisions, progress by area, problems encountered, solutions chosen, and locked decisions that should not be changed unless a clear reason is documented.

---

## Global Project Rules

### Rule 1: Professional folder/file structure
**Status:** LOCKED

Maintain a clean, scalable, professional project structure from day one. Routes, features, shared UI, infrastructure code, database migrations, and documentation should each have a clear home.

### Rule 2: If built twice, extract it
**Status:** LOCKED

Do not over-abstract too early. Build the first version locally. If the same pattern/component/function is needed a second time, extract it into a reusable component, utility, hook, or service.

### Rule 3: Locked means do not modify casually
**Status:** LOCKED

Any section marked `LOCKED` should not be changed without:
1. explaining why the change is needed,
2. documenting the new decision,
3. updating the change log.

### Rule 4: Mobile-first, device-agnostic design
**Status:** LOCKED

The application must work cleanly and intentionally across all device types:

- Mobile (primary design target)
- Tablet
- Desktop
- Large display panels (special case)

Design must be mobile-first. Desktop is an enhancement, not the baseline.

Each UI surface must be designed, not just resized, for its target device.

Key principles:
- No feature is considered complete without a mobile experience
- Layouts must adapt intentionally, not just responsively
- Touch targets must be usable on mobile
- Critical actions (e.g., "Order Now") must always be easily accessible
- Carousels and interactive elements must support touch gestures
- Sections should define behavior across breakpoints (mobile, tablet, desktop)
- Display panels are NOT responsive; they are fixed-layout views

Any UI that works well only on desktop is considered incomplete.

---


## Application Name

### MenuPilot
**Status:** LOCKED

MenuPilot is the working product name for the application. It is market-friendly, easy to remember, and communicates control over menus, ordering, websites, locations, and restaurant operations without sounding overly technical.


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

The design direction is:

> Shopify storefront + Toast-style operations + Webflow-lite structured builder.

---

## Technology Decisions

### Frontend
**Status:** LOCKED

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

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

### UI Library
**Status:** LOCKED

Use shadcn/ui as the primary UI foundation. Build missing components as needed instead of switching libraries prematurely.

---

## Core Architecture Decisions

### Multi-business and multi-location support
**Status:** LOCKED

The platform must support multiple businesses. Each business may have multiple locations. Menus, users, payment settings, delivery rules, displays, hours, and availability may be business-wide or location-specific.

### Product Configuration Engine
**Status:** LOCKED

Do not build a pizza-only engine. Build a generic Product Configuration Engine that supports pizza, wings, subs, salads, coffee, drinks, and other configurable products.

The engine must support:

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

Size/count/portion/weight choices should be product variants, not ordinary modifiers.

Examples:

- pizza: 10 inch, 12 inch, 14 inch
- subs: 6 inch, 12 inch
- wings: 6 piece, 12 piece, 1 lb, 2 lb
- soda: 20 oz, 2 liter

### Modifiers
**Status:** LOCKED

Modifiers represent configurable product options such as toppings, crust type, crust style, sauce, dressing, bread, cheese, or preparation options.

Modifier pricing must support:

- default option price
- product-specific price
- variant-specific price
- location-specific price
- prep-time delta

### Conditional modifier availability
**Status:** LOCKED

Modifiers must be filterable based on product, variant, location, and selected modifier dependencies.

Example:

- Gluten-free crust type is available only when size = 10 inch.
- Certain crust styles may only be available for selected crust types.

### Included modifier credits
**Status:** LOCKED

Specialty products may have default included modifiers and an included modifier allowance.

Example:

- Pepperoni pizza includes pepperoni.
- If pepperoni is removed and sausage is added, no extra charge occurs if the product has swappable included topping credits.
- A pizza may include 3 toppings and charge only for toppings beyond the included allowance.

### Pizza placement and multiplier
**Status:** LOCKED

Pizza toppings must support:

- whole
- left
- right
- optional future quarter support
- quantity multiplier such as 1x, 2x, 3x with admin-defined cap

### Related add-ons
**Status:** LOCKED

Products may have related add-ons or upsells.

Examples:

- wings -> sauce cups
- garlic bread -> dipping sauces
- salads -> extra dressings
- pizza -> sides or drinks

Related items must support admin-controlled behavior:

- auto-remove with parent
- allow independent purchase
- min/max quantity
- display label
- relationship type
- sort order

---

## Website Builder

### Structured page builder
**Status:** LOCKED

Use structured sections, not unrestricted drag-and-drop.

Admins can create pages, add sections, reorder sections, configure section settings, preview drafts, and publish.

Supported sections should include:

- hero
- text
- image
- image + text
- gallery
- card grid
- menu preview
- location hours
- map
- Google reviews
- call to action
- ad/local business listing style content

### Ads
**Status:** LOCKED FOR PHASE 1**

Do not create dedicated ad tables in Phase 1. Admins can create ad/listing pages using the regular page builder.

Dedicated advertiser/advertisement tables are optional Phase 3 functionality if paid placements, scheduling, analytics, or display-panel rotation are needed.

---

## Theme System

### Theme-driven storefront
**Status:** LOCKED

Customer-facing pages should use reusable themed components that read from theme tokens/CSS variables.

Admin and staff dashboards should remain mostly consistent for usability, with minor business branding allowed.

### Theme inheritance
**Status:** LOCKED

Theme behavior:

1. system theme defaults
2. business active theme
3. allowed page overrides
4. allowed section overrides

Some checkout, accessibility, and layout safety rules should remain locked.

---

## Operational Systems

### Orders
**Status:** PLANNED

Orders must support:

- pickup
- delivery
- future dine-in/curbside
- order statuses
- payment statuses
- searchable history
- order snapshots
- staff dashboard
- admin reporting

### Prep time
**Status:** PLANNED

Products, variants, and modifier options should support prep-time estimates. Orders should store the calculated estimate at order time.

### Delivery
**Status:** PLANNED

Delivery should support radius-based rules first, then zone/polygon support later.

### Payments
**Status:** PLANNED

Stripe should be used for online payments. Orders must store payment records, refunds, and payment status.

---

## Current Progress Summary

| Area | Status | Notes |
|---|---|---|
| Product vision | Mostly scoped | Strong conceptual foundation |
| Tech stack | Locked | Next.js, Supabase, shadcn, Stripe |
| Folder structure principle | Locked | Feature-first professional structure |
| Product configuration model | Locked conceptually | Needs SQL migration |
| Modifier pricing/restrictions | Locked conceptually | Needs SQL migration |
| Website builder | Scoped | Needs detailed schema/components |
| Theme system | Scoped | Needs implementation details |
| Payments | Scoped | Stripe selected |
| Delivery | Scoped | Radius first, zones later |
| Specials | Scoped | Needs careful implementation |
| Display panels | Scoped | Future phase |
| Printed menus | Scoped | Future phase |
| Google Maps/reviews | Scoped | Use page-builder sections |

---

## Known Problems and Solutions

### Problem: Same modifier has different prices for different products
**Solution:** Add product-specific and variant-specific modifier price rules.

### Problem: Modifier availability depends on selected size
**Solution:** Use variant-based modifier availability rules.

### Problem: Gluten-free crust should not be a fake size
**Solution:** Keep size as variant. Use crust type modifier filtered by selected size.

### Problem: Included toppings should not be charged again when removed and re-added
**Solution:** Use default modifiers plus included swappable modifier credits.

### Problem: Specials like “2 Large 3-Topping Pizzas”
**Solution:** Use structured special templates and bundle groups, not freeform discounts.

### Problem: Related add-ons should be tied to parent products sometimes
**Solution:** Use related item rules with auto-remove and independent purchase flags.

---

## Change Log

### 2026-05-06
- Created initial project state document.
- Recorded locked architecture decisions from planning conversation.

---

## Future Enhancements Revisit Later

These items are not all required for MVP, but they should remain visible so they can be revisited intentionally instead of forgotten.

### Platform Infrastructure
**Status:** FUTURE

- Backup and recovery strategy
- Migration rollback plan
- Staging environment with local, staging, and production separation
- Error monitoring and logging for Stripe failures, order issues, display failures, and webhook failures
- Rate limiting and abuse protection

### Data and Observability
**Status:** FUTURE

- Order event log tracking created, paid, accepted, preparing, ready, completed, cancelled, and refunded events
- Audit log UI showing who changed what and when
- Expanded reporting dashboards
- CSV export tools
- Import/export tools for menus and products

### Platform Owner Tools
**Status:** FUTURE

- Platform owner dashboard for managing businesses, locations, plans, and health status
- Admin impersonation/support mode
- System health monitoring

### Monetization
**Status:** FUTURE

- Stripe subscription billing
- Trial periods
- Plan tiers
- Feature gating by plan
- Active/suspended business states tied to billing

### Customization and Branding
**Status:** FUTURE

- Custom domains
- Advanced theme versioning
- Page version history
- Menu version history
- Display panel version history

### Legal and Compliance
**Status:** FUTURE

- Terms of service
- Privacy policy
- Cookie notice if needed
- Refund policy configuration
- Delivery policy configuration

### Operations
**Status:** FUTURE

- Kitchen ticket formatting
- Receipt formatting
- Printer integrations
- Advanced order throttling
- Load testing for lunch/dinner rush scenarios

### Accessibility and QA
**Status:** FUTURE

- Accessibility audit
- Keyboard navigation review
- Screen reader compatibility review
- Expanded automated test coverage
- Stress testing for pricing and product configuration logic
