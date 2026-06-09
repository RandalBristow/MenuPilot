# MenuPilot Project State

_Last updated: 2026-06-08_

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
| Product configurator | Working | ProductConfigurator resolves builder modes to PizzaBuilder, GenericConfigurableBuilder, SimpleProductBuilder, or unsupported future combo handling; variants, modifiers, included credits, variant-specific modifier availability/pricing, default cart flow, and return-configured-result mode used by DealBuilder children |
| Cart | Working | Provider, sheet, summary bar, localStorage, and nested orderable deal item type/display support |
| Checkout | Tenant route started | Legacy `/checkout` still resolves Pronto Demo/main-street. `/businesses/[businessSlug]/checkout` resolves the business and default location, validates active/orderable status, rejects cross-tenant carts, and uses server-side cart validation/repricing before creating unpaid pickup orders. Transaction/RPC still needed. |
| Staff orders | Tenant route started | Legacy `/staff/orders` still resolves Pronto Demo/main-street. `/businesses/[businessSlug]/locations/[locationSlug]/orders` resolves business/location context, filters reads by `business_id` and `location_id`, verifies order ownership before status updates, and displays Specials subtotal/discount/total snapshots when discounts exist. |
| Admin dashboard | Working demo | Modifier access moved under product management |
| Platform Admin | Started | `/platform`, `/platform/businesses`, `/platform/businesses/new`, and `/platform/businesses/[businessId]` list, create, inspect, and activate businesses/locations; business detail links to tenant admin shell; auth protection remains future |
| Tenant admin context | Started | `features/tenant` resolves business/location context and `/businesses/[businessSlug]/admin` shows the selected business context, default-location orderability, pizza pricing settings, setup sections for Product Catalog, Variants, Modifiers, Specials, Media, Customer Preview, and Locations / Orders when a location exists; tenant-scoped Product Admin, reusable Modifier Library, Specials Admin, Media Library, public menu reads, business-scoped checkout, and location-scoped staff orders exist. |
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
| Specials Engine | Orderable and Mix & Match deal admin/runtime/checkout wired | Business-scoped MVP schema and pure resolver exist; tenant-scoped Specials Admin can create/edit/enable/disable reusable passive specials with eligibility, date ranges, recurring windows, and expired-special reuse; Specials Admin can create/edit orderable deals with deal base price, component slots, quantity rules, component pricing mode/fixed price admin fields, exact allowed product choices, optional variant restrictions, and optional component/product Modifier Group included-count overrides; Specials Admin can create/edit Mix & Match fixed-unit-price rules, exact mix pools, optional variant restrictions, and optional pool-product Modifier Group included-count overrides; checkout applies the best currently eligible passive special after configured-product pricing, persists `discount_total`, adjusted `total`, and `order_discounts` snapshots; staff orders display subtotal/discount/total and applied discount snapshots; public menus show active Current Specials and eligible product badges; orderable deal component schema/types, pure orderable deal validation/pricing helper, pure Mix & Match validation/pricing helper, public DealBuilder runtime, public MixAndMatchBuilder runtime, nested deal cart type/display support, server-side orderable and Mix & Match deal checkout validation, parent/child order item snapshots, and staff nested deal display exist. Public DealBuilder/cart-add and checkout/order/staff now support included/free and fixed-price orderable component pricing modes; `normal_price` remains deferred and rejected. Passive specials do not apply to deal items in MVP. |

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
- `/businesses/[businessSlug]/admin/specials...` tenant-scoped Specials MVP admin
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

- Order creation is currently sequential after server-side validation. It should become a Supabase RPC/Postgres transaction before real payment use or production ordering.
- Admin and staff routes need auth/role protection.
- Platform Admin routes are not auth-protected yet and should not be publicly exposed.
- Platform/Tenant Admin can manage business and location activation state, but this remains internal until auth/role protection exists.
- Legacy demo routes still depend on seeded Pronto Demo/main-street records for compatibility. Tenant-scoped public menu, checkout, staff orders, business admin, Product Admin, reusable Modifier Library, and Media Library routes now exist; remaining follow-up is deciding when to retire or redirect legacy demo routes before the clean database rebuild.
- New-tenant manual regression must pass using `TENANT_ONBOARDING_REGRESSION.md` before wiping/rebuilding the development database.
- Public data access should be reviewed after auth and RLS are tightened.
- Mobile admin pages need continued 320px-430px visual checks as forms and list density evolve.
- Draft/publish versioning, billing/subscriptions, AI Owner Copilot, multiple builder visual layouts, BundleBuilder/ComboBuilder, and printable menu builder are intentionally deferred.
- Specials behavior should wait until builder mode foundation and product entry regression testing are complete. Specials MVP schema support, pure resolver, checkout integration, tenant-scoped admin UI, staff order discount display, public active-specials/menu badges, orderable-deal component schema/types, Specials Admin component editing, Mix & Match admin editing, pure orderable deal validation/pricing helper, pure Mix & Match validation/pricing helper, public DealBuilder runtime, public MixAndMatchBuilder runtime, nested cart deal item support, orderable and Mix & Match deal checkout/order snapshots, and staff nested deal display exist. Orderable deal components can override included Modifier Group counts for a selected component product without changing the product's normal modifier setup. Passive specials do not apply to deal items in MVP; rich cart preview, coupon UI, child deal reconfigure behavior, BOGO, free-item rewards, usage limits, category/subcategory component eligibility, and bundles are not built.
- Mix-and-match fixed unit price deals are modeled as their own special type, `mix_and_match_fixed_unit_price`. Schema/type foundation, tenant-scoped admin editing, a pure validation/pricing helper, public MixAndMatchBuilder runtime, cart parent/child display, checkout validation, nested order snapshots, and staff nested display exist through `special_mix_match_rules`, `special_mix_match_products`, `special_mix_match_product_variant_options`, `special_mix_match_modifier_group_overrides`, and `validateAndPriceMixAndMatchDeal`. The public builder loads exact eligible products, supports `Add to Mix`, routes customization through ProductConfigurator return mode, passes variant restrictions and Modifier Group included-count overrides, validates min/max/extra quantity rules, and adds one nested parent deal item to cart. Checkout reloads Mix rules and eligible products server-side, reprices child products, applies Mix-specific included-count overrides, rejects stale totals, and excludes passive discounts from Mix rows. Current Mix & Match admin editing does not support attached side components; existing orderable components remain the planned model for attached required or free side components such as "plus a 2-liter" in a later task. Mix pool products all use the fixed unit price, and explicit `0` included-count overrides are supported separately from blank/no override.
- Component-priced bundle deals should extend `orderable_deal`, not the flat Mix & Match pool. Migration `025_orderable_deal_component_pricing_modes.sql` adds `special_components.pricing_mode` (`included`, `fixed_price`, `normal_price`) and `special_components.fixed_price`. Tenant-scoped Specials Admin can save/reload Included/free and Fixed component price settings; Normal product price remains hidden/deferred. Public DealBuilder/cart-add and checkout/order/staff now use included/free and fixed component pricing modes, store component pricing snapshots, and display fixed/included child pricing. Checkout reloads deal config server-side, computes component base totals authoritatively, rejects stale totals, and continues rejecting `normal_price`. The target model for "Two Large 2-Topping Pizzas for $7.99 each with a free 2-liter" is three ordered components: two fixed-price large pizza components with Pizza Toppings included-count override 2, plus one included/free 2-liter component.
- Product entry regression audit found no code blocker, but Specials behavior still needs manual browser verification with real products, active/expired/disabled/lunch-window specials, checkout, and staff display before real launch.
- Product setup warns, without blocking save, when default selected modifier options exceed included selections for that Modifier Group. Defaults consume included slots and should not be treated as magic-free.
- Launch-critical operational gaps now tracked include dietary/allergen flags, quick 86 / temporarily sold out controls, a customer-facing order status page, realtime staff order updates, staff-entered / phone orders, and more prominent order/customer notes in staff views.
- Customer accounts, order history, reorder, PWA installability, nutritional info, catering requests, abandoned-cart recovery, gift cards/store credit, and advanced marketing remain V1/future work and should not block the immediate Specials/Mix-and-Match thread.
- Engineering hardening follow-ups include schema validation for large hand-parsed server actions, auditing the resolved `lucide-react` version, and improving Supabase mocks before revisiting Vitest parallel execution.

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
- Added Specials MVP schema support. Specials are business-scoped and support future line discounts, fixed-price line specials, cart discounts, product/menu-group eligibility, and `order_discounts` snapshots. Specials must apply after configured-product pricing; admin UI, public display, coupon UI, and BundleBuilder/ComboBuilder remain deferred.
- Added the pure Specials MVP resolver in `features/specials/utils/apply-specials-to-priced-cart.ts`. It consumes server-validated priced cart lines, evaluates active business-scoped specials, chooses the single best discount, returns discount totals and future `order_discounts` snapshot shapes, and remains unwired from checkout.
- Wired Specials MVP resolver into checkout. Checkout loads active scheduled specials for the resolved business, applies them after `validateAndPriceCart`, writes `orders.discount_total` and adjusted `orders.total`, and persists `order_discounts` snapshots after order item insertion. Specials Admin UI, public display, coupon UI, and BundleBuilder/ComboBuilder remain deferred.
- Added Specials MVP display support to staff orders. Staff order reads include `orders.subtotal`, `orders.discount_total`, and `order_discounts`; no-discount orders remain compact, cart-level discounts show in an applied discounts section, and line-level discounts show under the affected item.
- Added tenant-scoped Specials Admin UI under `/businesses/[businessSlug]/admin/specials`. Admin can create, edit, enable, disable, and reuse specials; expired specials remain listed and are not auto-disabled or deleted. Added recurring day/time availability windows and checkout eligibility filtering using the resolved location timezone.
- Added public active-specials display to tenant-scoped and legacy public menus. Menus show a Current Specials section for active specials and product badges for eligible line-level/fixed-price specials; disabled, expired, future, and inactive-now specials stay hidden, and checkout remains the authoritative discount calculation.
- Added schema/type foundation for orderable Specials deals. `orderable_deal` exists at schema/type level, `special_components` stores deal component slots, and `special_component_products` stores exact selectable products per component. Passive special eligibility remains separate from orderable deal component choices.
- Added pure orderable deal validation/pricing helper. `validateAndPriceOrderableDeal` validates already-priced proposed deal selections against business, schedule, component quantity rules, and exact allowed products, then prices deal base plus child extras.
- Added cart type/context/display support for nested orderable deal items. Cart can persist one parent deal line with nested components, child configured product snapshots, child modifiers, tenant metadata, base price, child extras, and parent total; deal entries count as one cart line.
- Added ProductConfigurator return mode for DealBuilder child products. Existing builders keep default cart behavior, but can now return a `ConfiguredProductResult` snapshot without mutating cart.
- Added public DealBuilder MVP for orderable Specials deals. Public menus can show active orderable deals, load exact component choices, add default child selections directly, customize child products through ProductConfigurator return mode, validate with `validateAndPriceOrderableDeal`, and add one nested parent deal item to cart. Mobile uses a step flow; larger screens use a wider product grid with a right-side deal summary panel.
- Added checkout/order snapshot support for orderable Specials deals. Checkout reloads active deal configuration, validates child products server-side, recalculates child extras, rejects stale deal totals, inserts a parent `order_items` row with `relationship_type = 'deal'`, inserts child rows with `parent_order_item_id` and `relationship_type = 'deal_component'`, and stores child modifiers on child item ids. Passive specials apply only to normal configured items, not deal items.
- Added Specials Admin component editing for orderable deals. The tenant-scoped Specials form can create/edit orderable deals with a deal base price, component labels/descriptions, quantity rules, and exact allowed product choices browsed by selected-business product category/subcategory; passive eligibility remains separate from orderable deal component choices.
- Added optional variant restrictions for orderable deal component products. `special_component_product_variant_options` stores reusable variant option allow-lists per component product; no rows means all enabled variants for that product are allowed. DealBuilder filters child ProductConfigurator variants from this allow-list, and checkout reloads/enforces the same server-side restrictions before saving an order.
- Added optional Modifier Group included-count overrides for orderable deal component products. `special_component_modifier_group_overrides` lets a deal component override a selected product's included count for an assigned Modifier Group only inside that deal context, such as a Large 2-Topping Pizza deal. Normal product modifier setup outside the deal is unchanged, and checkout enforces the override server-side.
- Added Specials Admin save/reload controls for orderable deal component pricing modes. Admin can set a component to Included/free or Fixed component price and save a fixed component price; Normal product price remains hidden/deferred until runtime/checkout support is implemented.
- Added public DealBuilder/cart-add support for orderable deal component pricing modes. Public orderable deal loading includes component pricing mode/fixed price; the pure helper prices included components at `$0`, fixed components at their fixed price per selected child quantity, and rejects `normal_price`; cart stores and displays component pricing snapshots.
- Added checkout/order/staff support for included/free and fixed-price orderable deal component pricing modes. Checkout loads `pricing_mode` and `fixed_price`, revalidates child products with server config, applies deal-context modifier included-count overrides, prices component base totals through `validateAndPriceOrderableDeal`, rejects stale totals and `normal_price`, persists component pricing metadata in parent/child order item notes, and staff orders show fixed/included copy for nested deal children.
- Updated ProductConfigurator return mode for orderable deal component pricing context. DealBuilder child customization now shows fixed component price plus extras or included/free plus extras in the builder sticky submit total, while preserving the normal configured-product pricing snapshot for server-side extra calculation.
- Documented the Specials/Deals roadmap and Mix-and-Match fixed unit price design. Planned deal types now include `mix_and_match_fixed_unit_price`, BOGO, free item with purchase, discounted add-ons, coupon codes, usage limits, category/subcategory component eligibility, tax/discount ordering, and future customer/account promos. Mix-and-match runtime and checkout behavior are now wired for the MVP; advanced deal types remain pending.
- Added Mix-and-Match fixed unit price checkout/order/staff support. Public menus show active Mix & Match deals with a Build Mix & Match action; MixAndMatchBuilder loads exact eligible products, supports default add/customize, passes variant restrictions and Modifier Group included-count overrides into ProductConfigurator return mode, validates selected quantity and totals with `validateAndPriceMixAndMatchDeal`, and adds one nested parent cart item. Checkout reloads server Mix config, reprices children, validates stale totals, writes nested parent/child order item snapshots, and staff orders display the nested Mix deal.
