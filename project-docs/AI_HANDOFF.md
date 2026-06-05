# MenuPilot AI Handoff

_Last updated: 2026-06-05_

## Overview

MenuPilot is a multi-business, multi-location restaurant platform combining public menus, online ordering, configurable products, staff order handling, and admin menu management. Future phases include website/page building, themes, inventory, reporting, subscriptions, delivery tooling, printed menus, and display panels.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui and Radix primitives
- Supabase/Postgres with RLS foundation
- Vitest
- Stripe planned

## Current Implementation Snapshot

Working now:
- `/` public entry page.
- `/menu` customer menu for the seeded Pronto Demo business.
- `/businesses/[businessSlug]` tenant-scoped storefront landing route. It resolves the selected business, shows storefront/orderability status, links to the scoped menu, and only links to checkout when the default location is orderable.
- `/businesses/[businessSlug]/menu` tenant-scoped public menu route. Active businesses show normally. Setup businesses show preview messaging and disable customer ordering actions so the UI does not imply public ordering is live.
- Product configurator with reusable variant groups, modifier groups, included credits, multiplier-aware pricing, and cart integration.
- Cart provider, summary bar, sheet UI, and localStorage persistence.
- `/checkout` legacy pickup checkout for Pronto Demo/main-street and `/businesses/[businessSlug]/checkout` tenant-scoped checkout using the business default location. Checkout validates business/location orderability, rejects cross-tenant carts, validates/reprices cart contents server-side, and writes unpaid orders to Supabase.
- `/staff/orders` legacy staff queue for Pronto Demo/main-street and `/businesses/[businessSlug]/locations/[locationSlug]/orders` tenant/location-scoped staff queue. Staff reads filter by business/location IDs, and status updates resolve slugs server-side before verifying order ownership.
- `/admin` admin hub.
- `/admin/media` Media Library for image upload/import metadata backed by `media_assets`.
- `/admin/products` product management hub and product/category/subcategory/product form flows.
- Admin product list supports duplicating a product into a new disabled-by-default product copy. Duplication copies product-scoped category placement, variant assignments/overrides, Modifier Group assignments/overrides, default modifiers, included modifier rules, variant availability rules, and variant-specific modifier price overrides while reusing global variant, modifier, and media records.
- Products select images from Media Library through `products.image_media_id`.
- Reusable variant group list, option editing, product assignment, and per-product overrides.
- Modifier library flow using the updated hierarchy.
- Product modifier group assignment with per-product modifier option overrides.
- Product Modifier Assignments show a compact pricing warning when default selected modifier options exceed the included selections configured for that assigned Modifier Group. This warning does not block saving and does not change pricing.
- Modifier option setup cleanup supports safe hard delete for unused options and moving options between Modifier Option Groups inside the same Modifier Group.
- Modifier Option sort order is scoped per Modifier Option Group/List. "Next Available" should use max sort order plus one only within the selected `modifier_option_group_id`.
- Modifier Options should belong to a Modifier Option Group/List. Seed cleanup backfilled lists for direct seed options; admin option create/edit should require a list instead of creating ungrouped options.
- Modifier Option Group/List sort order is scoped within its parent Modifier Group and controls how option lists appear in builders.
- Modifier Group sort order is scoped within its Modifier Category and controls the order of builder sections such as Crust Type, Crust Style, Pizza Sauce, and Pizza Toppings.
- Variant-specific modifier option availability filtering.
- Variant-specific modifier option price overrides on the product Modifier Group variant rules page.
- ProductConfigurator resolves runtime builder modes to PizzaBuilder, GenericConfigurableBuilder, SimpleProductBuilder, or unsupported future combo handling.
- Minimal Platform Admin onboarding schema support exists: businesses have primary contact fields, locations have a setup/active-style `status` field, new businesses/locations default to `setup`, and new locations default to ordering disabled.
- Internal Platform Admin list/detail pages exist at `/platform`, `/platform/businesses`, and `/platform/businesses/[businessId]` for reviewing business contact fields, setup status, locations, and ordering flags.
- Internal Platform Admin create flow exists at `/platform/businesses/new`. It creates a setup-mode business and first setup-mode location; the first location starts disabled and not accepting orders.
- Platform Admin business detail includes activation controls. The app owner can set business status (`setup`, `active`, `paused`, `archived`) and each location's status plus `is_enabled`, `accepting_orders`, `pickup_enabled`, and `delivery_enabled`. The location action forces `accepting_orders` off unless the location is active, enabled, and has pickup or delivery enabled.
- Tenant resolver helpers exist in `features/tenant` for resolving business and location context by slug/id.
- Tenant-aware business admin shell exists at `/businesses/[businessSlug]/admin`. Platform Admin business detail links to it with "Open Business Admin". The landing page is organized as Product Catalog, Variants, Modifiers, Media, Customer Preview, Locations / Orders when a location exists, and Future / Not Ready. It shows default-location orderability and explains reusable Variant Groups and reusable Modifier Library setup before product-specific assignments.
- Tenant-scoped Product Admin route shells exist under `/businesses/[businessSlug]/admin/products...`. They use the selected business for product/category/subcategory/variant/modifier-assignment read queries and scoped links. Core product mutations, category/subcategory saves, reusable variant saves, product variant assignment/override saves, product Modifier Group assignment/included/default saves, and variant-specific modifier availability/price saves resolve `businessSlug` server-side and validate ownership.
- Tenant-scoped Admin Modifier Library route shells exist under `/businesses/[businessSlug]/admin/modifiers...`. They use the selected business for Modifier Category, Modifier Group, Modifier Option Group/List, Modifier Option, safe delete, move, and modifier option override writes. Legacy `/admin/modifiers...` remains demo-scoped for compatibility.
- Tenant-scoped Admin Media route shell exists at `/businesses/[businessSlug]/admin/media`. It uses the selected business for media reads, uploads, URL imports, metadata edits, and storage paths. Legacy `/admin/media` remains demo-scoped for compatibility.
- `project-docs/ROADMAP.md` records the current near-term order and future architecture decisions.
- `project-docs/PRODUCT_ENTRY_REGRESSION_MATRIX.md` records the product entry regression audit and manual verification checklist.
- `project-docs/TENANT_ONBOARDING_REGRESSION.md` records the final manual new-business checklist before deciding whether to wipe/rebuild the development database.

Current gaps:
- Admin/staff auth is not enforced yet.
- Platform Admin auth/role enforcement is not built yet; do not expose Platform Admin publicly.
- Platform Admin create flow does not use a database transaction/RPC yet. If first-location insert fails, the action attempts to delete the newly-created business and returns a user-safe error.
- Checkout creates orders after server-side price validation but still needs a transaction/RPC pattern.
- Stripe payment, webhooks, refunds, and payment status automation are not implemented.
- Legacy `/checkout` and `/staff/orders` still use seeded Pronto Demo/main-street records for compatibility.
- Tenant-aware routing/context exists for the main Platform Admin path before the clean database rebuild: tenant admin shell, tenant-scoped Product Admin reads/writes, tenant-scoped Admin Modifier Library reads/writes, tenant-scoped Admin Media reads/writes, tenant-scoped public menu reads, business-scoped checkout, and location-scoped staff orders. Remaining work is deciding when to retire/redirect legacy demo routes and completing auth/role protection.
- New-tenant manual regression has not passed yet. Use `TENANT_ONBOARDING_REGRESSION.md`; do not wipe/rebuild the development database until that checklist passes or exceptions are documented.
- Website builder, theme editor, inventory, reporting, delivery, and display panels remain future work.

Recently completed:
- Variant-specific modifier option price overrides are done. Do not treat "add variant-specific modifier option price overrides" as the next task; future work should verify, refine, or extend the existing implementation.
- Builder template support is formalized for admin-created non-combo templates. Current runtime builders are PizzaBuilder, GenericConfigurableBuilder, and SimpleProductBuilder. Combo/BundleBuilder remains future work before true bundle specials or meal deals.
- Product entry cleanup/foundation items now considered complete include modifier cleanup tools, scoped Modifier Option sort order, selected modifier row styling, product image optimization first pass, sticky builder dialog shell cleanup, product duplication, and styled/themed accordion foundation.
- Product entry regression audit found code-path support for pizza, generic configurable products, simple variant-only products, simple quantity-only products, and combo unsupported fallback. Manual admin-to-staff browser verification remains before Specials Engine.

## Modifier Hierarchy

The current modifier terminology is important:

- Modifier Category: admin organization layer backed by `modifier_categories`.
- Modifier Group: product-attached rule set backed by `modifier_groups`.
- Modifier Option Group: subgroup/bucket inside a Modifier Group, such as Meats, Veggies, or Cheeses, backed by `modifier_option_groups`.
- Modifier Option: actual selectable choice, such as Pepperoni, Ranch, or Gluten Free, backed by `modifier_options`.
- `product_modifier_groups` attaches a reusable Modifier Group to a product.
- `product_modifier_option_overrides` stores product-specific option price, prep time, enabled, and sort overrides.
- `product_variant_modifier_option_availability_rules` stores product + selected reusable variant option + Modifier Group + Modifier Option availability.
- `product_variant_modifier_option_price_overrides` stores product + selected reusable variant option + Modifier Group + Modifier Option price overrides.

Modifier option price priority is:

1. enabled variant-specific modifier option price override
2. product-specific modifier option price override
3. global modifier option price

Modifiers should behave like variants:

- Define reusable objects globally.
- Products attach Modifier Groups.
- Products do not attach Modifier Categories.
- Products do not attach Modifier Option Groups directly.
- Products do not attach individual Modifier Options directly except through product-specific override/availability systems.
- Store product-specific differences as overrides.
- Remove assignment-specific overrides when the assignment is removed.
- Keep unassigned reusable objects view-only in product context.
- Modifier Categories are for admin organization only.
- Modifier Option Groups organize options inside a Modifier Group.

## Key Architecture Rules

- Feature-first folder structure is required.
- Routes in `app/` must stay thin.
- Business logic belongs in `features/`, `lib/`, or database migrations.
- Use existing themed components and project UI patterns.
- All database changes must be migrations.
- Mobile-first UI is required.
- TypeScript is required; avoid `any` unless unavoidable.
- If a pattern is built twice, extract it.
- Configurable product pricing belongs in `lib/pricing/price-configured-product.ts`.
- Builders must not implement independent configurable-product pricing math.
- Checkout must validate server-loaded config, then use the shared pricing helper instead of trusting client-submitted cart prices.
- Product builders should render Modifier Option Group sections through the shared builder option group accordion/list component and themed accordion instead of duplicating selected option row UI.
- The expected data model is one shared multi-tenant database. Business-owned records use `business_id`; location-specific records use `location_id` where appropriate. Businesses should not each receive a separate database by default.
- Platform Admin / App Owner tooling should eventually manage businesses and locations. New businesses and locations should start in `setup`; new locations should keep ordering disabled until explicitly activated.
- Checkout requires active business status and an active, enabled, accepting-orders location with pickup or delivery enabled. Activation controls live on Platform Admin business detail for now.
- Platform Admin lets the app owner open a selected business in explicit business admin context at `/businesses/[businessSlug]/admin`. Product Admin, reusable Modifier Library, and Media Library scoped actions are available under this route family.
- Business admin headers should make the active business/location context visible and provide a path back to Platform Admin plus a switch-business action.
- Tenant admin landing pages should separate Product Catalog, Variants, Modifiers, Media, and Customer Preview. Reusable variants/modifiers are business-level setup; product variant assignments and product modifier assignments are product-specific setup.
- Business-level admin covers products, modifiers, variants, media, specials, and other business-owned setup. Location-level admin covers orders, hours, ordering settings, staff, and other location-owned setup.
- Product setup warns when default selected modifier options exceed included selections for that group. Defaults consume included selections; the warning catches specialty pizza pricing mistakes without blocking save or changing pricing.
- AI should not be part of the current sprint or MVP scope.
- Draft/publish versioning is future work, not a current product-entry blocker.

## Builder Mode Roadmap

Active direction:

1. `PizzaBuilder` remains custom for pizza-specific placement, included toppings, defaults, size-based topping pricing, and pizza UX.
2. `GenericConfigurableBuilder` is for non-pizza configurable products with modifier groups, including salads, subs, wings, pasta, coffee, appetizers, and kids meals.
3. `SimpleProductBuilder` is for variant-only or quantity-only products, including drinks, chips, desserts, extra sauce cups, and simple sides.
4. Future `BundleBuilder` / `ComboBuilder` is for specials, combos, meal deals, and multi-product offers.

Do not confuse builder behavior with presentation. `builder_template` describes behavior/product type; future `builder_layout` should describe visual presentation; theme controls colors, fonts, spacing, and brand feel. All layouts must share the same pricing engine and server validation.

## Current Goal

The active focus is stabilizing the mobile-first admin product/modifier flow:

1. Run the manual Product Entry Regression Matrix for Pizza, Chicken Salad, drink with variants only, simple item, extra sauce, sub with modifiers, and wings with count/sauce modifiers.
2. Run `TENANT_ONBOARDING_REGRESSION.md` for a Platform Admin-created business.
3. Preserve public ordering correctness while admin data structures evolve.

## Suggested Next Steps

1. Run `TENANT_ONBOARDING_REGRESSION.md` end to end.
2. Run the product entry regression matrix through admin setup, customer builder/add, cart, checkout, and staff order display.
3. Do not start Specials Engine until product entry and tenant onboarding manual regression testing are complete.
4. Decide whether legacy demo routes should be retired/redirected or kept as explicit compatibility routes before the clean database rebuild.
5. Keep full draft/publish versioning, billing/subscriptions, AI Owner Copilot, multiple builder visual layouts, BundleBuilder/ComboBuilder, printable menu builder, and customer-facing AI deferred.
