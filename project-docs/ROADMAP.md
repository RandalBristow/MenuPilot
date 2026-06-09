# MenuPilot Roadmap

_Last updated: 2026-06-08_

This document records the current agreed order of work and future architecture decisions so they are not re-decided during later implementation.

## Current Order

Near-term sequence:

1. Product Entry Foundation.
2. Platform Admin / Business Onboarding.
3. Clean database rebuild.
4. Specials Engine.
5. Draft / Publish / Versioning.
6. Printable Menu Builder.
7. Builder Layout Variants / Theming.
8. Owner Copilot / AI.

Current focus:

- [~] Finish Specials/Deals regression and cart edit/reconfigure follow-up for orderable and Mix-and-Match deals.
- [~] Finish Specials/Deals regression with real tenant data before expanding into more deal types.
- [ ] Keep launch-critical restaurant operations visible in the backlog while Specials stabilizes.

Engineering hardening to track:

- [ ] Refactor large server actions that hand-parse `FormData`, such as `features/specials/actions/save-special.ts`, to schema validation with Zod or an equivalent after Specials/Mix-and-Match stabilizes.
- [ ] Replace sequential checkout order creation with a Supabase RPC/Postgres transaction before real payments or production ordering.
- [ ] Audit the resolved `lucide-react` version with `npm ls lucide-react`; package metadata appears to reference `^1.14.0`.
- [ ] Improve Supabase module mocks and revisit Vitest parallelization. Serial tests with `fileParallelism: false` and `maxWorkers: 1` are acceptable for now.

Launch-critical restaurant operations:

- [ ] Add dietary/allergen flags for product safety and customer filtering.
- [ ] Add quick 86 / temporarily sold out controls for staff-friendly temporary unavailability.
- [ ] Add customer-facing order status page that exposes only safe order/status details.
- [ ] Make staff order updates realtime before launch; staff should not depend on manual refresh.
- [ ] Add staff-entered / phone orders.
- [ ] Make customer/order notes prominent in staff order views.
- [ ] Make checkout order creation transactional before payments/production.

V1 customer experience:

- [ ] Add customer accounts or lightweight phone/email lookup for order history and reorder.
- [ ] Add public multi-location selection UX with address/distance/context.
- [ ] Add PWA/installable app support.
- [ ] Add nutritional information such as calories and optional macros.
- [ ] Add catering inquiry / large-order request flow.

Future monetization and marketing:

- [ ] Add abandoned cart / incomplete checkout recovery after customer identity and notifications exist.
- [ ] Add gift cards / store credit.
- [ ] Add age verification flow if alcohol or regulated products are supported.
- [ ] Add advanced customer marketing and notification tooling.

### 1. Product Entry Cleanup And Foundation

Completed:

- [x] Modifier cleanup tools.
- [x] Modifier Option sort order scoped per Modifier Option Group/List.
- [x] Selected modifier row styling cleanup.
- [x] Product image optimization first pass.
- [x] Sticky builder dialog shell cleanup.
- [x] Product duplication.
- [x] Styled/themed accordion foundation.
- [x] Builder mode foundation.
- [x] Product setup warning for default modifiers exceeding included selections.

Remaining:

- [~] Product entry regression matrix audited in `PRODUCT_ENTRY_REGRESSION_MATRIX.md`; manual browser verification remains.
- [~] Tenant onboarding regression checklist exists in `TENANT_ONBOARDING_REGRESSION.md`; manual browser verification remains.

### 2. Builder Mode Foundation

Active builder modes:

- `PizzaBuilder`
  - Remains custom.
  - Supports pizza-specific placement, included toppings, defaults, size-based topping pricing, and pizza-specific UX.
- `GenericConfigurableBuilder`
  - Intended for non-pizza configurable products with modifier groups.
  - Covers salads, subs, wings for now, plus future pasta, coffee, appetizers, kids meals, and similar configurable products.
  - Implemented through the existing shared non-pizza configurable behavior and shared modifier UI.
- `SimpleProductBuilder`
  - Intended for variant-only or quantity-only products.
  - Covers drinks, chips, desserts, extra sauce cups, simple sides, and similar simple products.
  - Implemented for products with no modifier groups.

Future builder:

- `BundleBuilder` / `ComboBuilder`
  - Future work for specials, combos, meal deals, and multi-product offers.

Builder behavior and builder presentation must stay separate:

- `builder_template` describes behavior/product type.
- Future `builder_layout` should describe presentation.
- Theme controls colors, fonts, spacing, and brand feel.
- Possible future pizza layouts include compact accordion, visual card layout, and step-by-step layout.
- All layouts must share the same pricing engine and server validation.

### 3. Product Entry Regression Matrix

Before leaving product entry, test one real item per type:

- [ ] Pizza.
- [ ] Chicken Salad.
- [ ] Drink with variants only.
- [ ] Simple item.
- [ ] Extra sauce.
- [ ] Sub with modifiers.
- [ ] Wings with count and sauce modifiers.

Each item must pass:

- [ ] Admin setup.
- [ ] Customer builder/add.
- [ ] Cart.
- [ ] Checkout.
- [ ] Staff order display.

### 4. Platform Admin / Business Onboarding

Needed before wiping the database and rebuilding from scratch.

Schema foundation completed:

- [x] Businesses have optional primary contact fields.
- [x] Locations have a setup/active-style `status` field.
- [x] New businesses default to `setup`.
- [x] New locations default to `setup` with ordering disabled.
- [x] Internal Platform Admin hub, business list, and business detail pages exist for inspecting setup state.
- [x] Internal Platform Admin create-business and first-location form exists.
- [x] Platform Admin create-business flow creates the default `Main Menu` scaffold required for product category setup.
- [x] Platform Admin business detail can update business activation status and location status/order flags.
- [x] Tenant resolver helpers exist for business/location context.
- [x] Tenant-aware business admin shell exists at `/businesses/[businessSlug]/admin` with setup sections for Product Catalog, Variants, Modifiers, Media, Customer Preview, and disabled future items.
- [x] Tenant-scoped Product Admin route shells exist at `/businesses/[businessSlug]/admin/products...`.
- [x] Tenant-scoped core product mutations exist for create, update, delete, enable/disable, and duplicate.
- [x] Tenant-scoped category/subcategory mutations exist for create, update, and enable/disable saves; they defensively create the default product menu for fresh tenants missing the scaffold.
- [x] Tenant-scoped reusable variant group/option and product variant assignment/override mutations exist.
- [x] Tenant-scoped product Modifier Group assignment, included/default modifier, and variant-specific modifier availability/price mutations exist.
- [x] Tenant-scoped reusable Admin Modifier Library routes/actions exist for Modifier Categories, Modifier Groups, Modifier Option Groups/Lists, Modifier Options, safe deletes, option moves, and modifier option overrides reached from modifier detail pages.
- [x] Tenant-scoped Admin Media route/actions exist for media reads, uploads, URL imports, metadata edits, and selected-business storage paths.
- [x] Tenant-scoped public menu route exists at `/businesses/[businessSlug]/menu`; legacy `/menu` remains pointed at `pronto-demo`.
- [x] Business-scoped checkout route exists at `/businesses/[businessSlug]/checkout`; legacy `/checkout` remains pointed at Pronto Demo/main-street.
- [x] Location-scoped staff order route exists at `/businesses/[businessSlug]/locations/[locationSlug]/orders`; legacy `/staff/orders` remains pointed at Pronto Demo/main-street.
- [x] Business-level pizza half-topping pricing settings exist and are editable from Platform Admin business detail and the tenant admin shell.

MVP should support:

- [x] Platform/app owner creates a business.
- [x] Platform/app owner creates the first location.
- [x] Business starts in setup status.
- [x] Location starts in setup status.
- [x] Online ordering is disabled by default.
- [x] Platform/app owner can activate a business/location and enable ordering flags when ready.
- [x] Owner/contact info can be recorded if practical.
- [ ] Future support for assigning business owner users/roles.

Next Platform Admin step:

- [ ] Keep Platform Admin hidden/internal until auth/role enforcement is added.
- [x] Add tenant-aware admin/menu/staff/checkout routing and selected business/location context before the clean database rebuild.
- [~] Run `TENANT_ONBOARDING_REGRESSION.md` before the clean database rebuild.
- [ ] Decide whether to retire/redirect legacy seeded demo routes before the clean database rebuild.
- [x] Convert admin product pages/actions to use tenant-aware context for product-owned setup.
- [x] Convert admin modifier library pages/actions to use tenant-aware context.
- [x] Convert admin media pages/actions to use tenant-aware context.

Platform Admin business context/switcher direction:

- Platform Admin should let the app owner select a business and open that business's admin context.
- Long term, tenant context should be explicit in the URL instead of relying only on local/session state.
- Possible route shape: `/businesses/[businessSlug]/admin`, or another explicit business-slug admin route chosen during implementation.
- The Platform Admin business detail page exposes a clear "Open Business Admin" action.
- Product Admin routes under `/businesses/[businessSlug]/admin/products...` support product-owned reads/writes, including core products, category/subcategory, reusable variants, product variant assignments/overrides, product Modifier Group assignments, included/default modifiers, and variant-specific modifier availability/price rules.
- Admin Modifier Library routes under `/businesses/[businessSlug]/admin/modifiers...` support business-scoped reusable modifier reads/writes. Legacy `/admin/modifiers...` remains demo-scoped.
- Admin Media route `/businesses/[businessSlug]/admin/media` supports business-scoped media reads/writes/uploads/imports. Legacy `/admin/media` remains demo-scoped.
- Public menu route `/businesses/[businessSlug]/menu` supports business-scoped menu reads and product configurator loading. Legacy `/menu` remains demo-scoped for compatibility.
- Checkout route `/businesses/[businessSlug]/checkout` resolves the business and deterministic default location, blocks setup/inactive/non-orderable contexts, rejects cross-tenant carts, and preserves legacy `/checkout` for demo compatibility.
- Platform Admin business detail controls activation: businesses support `setup`, `active`, `paused`, and `archived`; locations support the same status values plus enabled, accepting orders, pickup, and delivery flags. Checkout requires active/orderable business and location state.
- Fresh businesses need a business-level `Main Menu` row before product categories can be created. Platform Admin creates it during onboarding, and the category/subcategory save path repairs existing fresh tenants that are missing it.
- Tenant admin landing page separates business-level reusable setup from product-specific setup: Variant Groups and Modifier Library are reusable business setup; Product Variant Assignments and Product Modifier Assignments are product-specific setup.
- Admin headers should show visible context such as `Managing: {Business Name}`, current location context where relevant, a link back to Platform Admin, and a switch-business action.
- Business-level admin covers products, modifiers, variants, media, specials, and other business-owned setup.
- Location-level admin covers orders, hours, ordering settings, staff, and other location-owned setup.
- Multi-location businesses need a location selector where location-specific records are managed.

Tenant context resolver required before clean rebuild:

- Legacy demo flows still assume seeded Pronto Demo business/location records.
- A central resolver exists; use it in later conversion work so the app is not stranded without `pronto-demo` or `main-street`.
- The resolver should resolve business slug/id and location slug/id for the current route/context.
- Public menu, business-scoped checkout, and location-scoped staff orders now use resolved tenant context for scoped routes.
- Do not start the clean database rebuild until `TENANT_ONBOARDING_REGRESSION.md` passes or any exceptions are explicitly documented.

### 5. Clean Database Rebuild

After product entry and platform onboarding are ready:

- [ ] Pass `TENANT_ONBOARDING_REGRESSION.md`.
- [ ] Pass `PRODUCT_ENTRY_REGRESSION_MATRIX.md` manual checks.
- [ ] Wipe/reseed/reset development data.
- [ ] Create a new business through Platform Admin.
- [ ] Create the first location through Platform Admin.
- [ ] Activate the business and first location through Platform Admin when product/menu setup is ready.
- [ ] Build products, modifiers, variants, media, and specials as a real new business would.
- [ ] Use this as the true onboarding test.

### 6. Specials Engine

Start after product entry foundation and builder modes are stable.

Schema foundation completed:

- [x] Business-scoped Specials MVP tables exist for `line_discount`, `fixed_price_line`, and `cart_discount`.
- [x] Product and menu group eligibility tables exist at schema level.
- [x] `order_discounts` exists for applied discount snapshots.
- [x] Pure shared resolver exists for active/scheduled eligibility, best-single-special selection, line discounts, fixed-price line specials, and cart discounts.
- [x] Checkout integration applies Specials after configured-product pricing and writes `order_discounts` snapshots.
- [x] Staff/order display shows subtotal, discount total, final total, and applied discount snapshots when discounts exist.
- [x] Tenant-scoped Specials Admin UI exists for create/edit, enable/disable, eligibility, date ranges, recurring windows, and expired-special reuse.
- [x] Public menu specials display exists for active Current Specials and eligible product badges.
- [x] Orderable deal schema/type foundation exists for future `orderable_deal` Specials, deal components, and exact selectable component products.
- [x] Pure orderable deal validation/pricing helper exists for already-priced proposed deal selections.
- [x] Cart type/context/display support exists for nested orderable deal parent items with component child product snapshots.
- [x] ProductConfigurator/builders can return configured child product snapshots without mutating cart.
- [x] DealBuilder/orderable deal runtime exists for public menus and can add one nested parent deal item to cart.
- [x] Checkout/order snapshot support exists for orderable deals.
- [x] Staff nested orderable deal display exists.
- [x] Specials Admin component editing for orderable deals exists with deal base price, component quantity rules, and exact allowed product choices browsed by selected-business product category/subcategory.
- [x] Optional reusable variant option restrictions exist for orderable deal component products. No restriction rows means all enabled variants are allowed; saved restrictions limit DealBuilder and checkout to those variant options.
- [x] Optional Modifier Group included-count overrides exist for orderable deal component products. No override row means the product's normal included rule is used; saved overrides apply only inside that deal component.
- [ ] Rich cart specials preview is pending.
- [ ] Coupon UI is pending.
- [ ] BundleBuilder/ComboBuilder remains deferred.
- [x] Mix-and-match fixed unit price deals have schema/type foundation, tenant-scoped admin editing, pure validation/pricing helper, public builder runtime, cart parent/child display, checkout validation, nested order snapshots, and staff nested display.

Specials should eventually support:

- Discount specials.
- Product/category eligibility.
- Bundle/meal-deal specials.
- Orderable deal components with allowed product choices.
- Pizza specials.
- Cart/checkout validation.
- Menu/deal cards.
- Staff/order snapshots.

Before Specials Engine starts:

- [x] Builder Mode Foundation complete.
- [~] Product Entry Regression Matrix audited; manual full-flow pass still required.
- [x] Product duplication working.
- [x] Shared pricing resolver confirmed through pizza, generic configurable, and simple products in code/tests.
- [~] Normal products can reach cart, checkout, and staff display in code paths; manual browser verification still required.
- [~] Platform Admin onboarding path:
  - Platform Admin schema, list/detail, and create flow are complete.
  - Tenant resolver helpers, business admin shell, Product Admin read/write shells, Admin Modifier Library read/write shells, and Admin Media read/write shell are complete.
  - Tenant-aware staff routing/context is available through the location-scoped staff order route.

MVP sequencing:

1. [x] Cart type/support for nested deal items.
2. [x] Product configurator return mode for DealBuilder child products.
3. [x] DealBuilder MVP using existing product builders.
4. [x] Checkout validation/order snapshot support for orderable deals.
5. [x] Staff display for nested deal items.
6. [x] Specials Admin component UI.
7. Public menu orderable deal cards/polish.
8. Rich cart passive-special preview.
9. Optional coupon code support.

Do not build BundleBuilder/ComboBuilder or coupon UI as the first orderable deal behavior. Exact allowed product selection per component is the first orderable deal MVP. Optional component product variant restrictions are supported for cases such as "2 Liter only" or "Large pizza only"; optional component/product Modifier Group included-count overrides are supported for cases such as "Large 2-Topping Pizza." Component pricing mode schema/admin/public-cart/checkout/order/staff support exists for ordered bundles such as two fixed-price pizzas plus an included/free 2-liter. `normal_price` component pricing remains deferred and rejected by checkout. Category/subcategory eligibility rules, allowed/excluded modifier option rules, BOGO, coupons, free-item rewards, usage limits, and exclusions remain deferred.

Planned Specials / Deals backlog:

- [x] `line_discount`.
- [x] `fixed_price_line`.
- [x] `cart_discount`.
- [x] `orderable_deal` with fixed/base price and required components.
- [x] Recurring availability windows.
- [x] Variant restrictions for orderable components.
- [x] Modifier included-count overrides for orderable components.
- [x] Component pricing modes for orderable components: schema/type foundation, admin save/reload controls, public DealBuilder pricing, cart display, checkout/order snapshots, and staff display exist for included/free and fixed-price modes; `normal_price` remains deferred.
- [x] `mix_and_match_fixed_unit_price` schema/type foundation, tenant-scoped admin editing, pure validation/pricing helper, public builder runtime, cart parent/child display, checkout validation, nested order snapshots, and staff nested display.
- [ ] Category/subcategory component eligibility.
- [ ] BOGO.
- [ ] `free_item_with_purchase`.
- [ ] `discounted_add_on`.
- [ ] `coupon_code`.
- [ ] Usage limits: one per order, limited total redemptions, location-specific, fulfillment-specific carryout/delivery.
- [ ] Tax/discount ordering.
- [ ] Customer/account-specific promos.

Recommended next Specials build:

- Build cart edit/reconfigure behavior for orderable deals and Mix-and-Match deals after checkout/order/staff regression is manually verified.
- Regression-test orderable deal component pricing modes through public build, checkout, order snapshots, and staff display.
- Do not build BOGO, coupon UI, usage limits, free-item rewards, side components, or category/subcategory component eligibility until explicitly requested.

## Product Setup Warnings

Implemented warning, not a blocker, when a product has default selected modifier options in a Modifier Group but missing or insufficient included selections for those defaults.

Example warning:

> Meat Pizza has 5 default Pizza Toppings, but only 0 included selections. Default toppings beyond included count will be charged.

Rules:

- Defaults consume included selections; they are not automatically free.
- The warning catches specialty pizza pricing mistakes before customer ordering.
- Placement is Product Modifier Assignments, with a repeated warning in the included selection settings sheet for the assigned Modifier Group.
- Do not change pricing behavior for this warning.

## Builder UI Polish Backlog

These are polish items, not Specials blockers unless a concrete bug is found:

- Defer required validation messages until the user tries to add to cart or interacts with the group.
- Use the configured variant group name instead of generic "Choose an option" in SimpleProductBuilder.
- Make quantity-only SimpleProductBuilder dialogs more compact.
- Tune accordion padding and header density.
- Keep PizzaBuilder visually lighter.
- Preserve the shared pricing resolver; do not duplicate pricing math in builders.

## Future Structural Layers

### Draft / Publish / Versioning

Future structural layer after specials MVP and before real customer launch.

Intended model:

- Admin edits draft content.
- Customer-facing site shows latest published version.
- Publish creates or activates a business content version.
- Versioning should apply beyond products.
- Prefer real version records over only scattered `is_published` flags.
- Use both a version number and published timestamp.

Versioning should eventually include:

- Products.
- Categories/subcategories.
- Variants.
- Modifiers.
- Pricing rules.
- Defaults.
- Included rules.
- Specials.
- Media selections.
- Printable menu builder.
- Future homepage/menu display settings.

### Printable Menu Builder

Future feature. Printable menus should use product, category, and special data from the same source of truth and should eventually participate in draft/publish/versioning.

### Owner Copilot / AI Assistant

Future post-MVP/post-rollout enhancement.

AI should be owner/admin assist only, not customer-facing. It is not part of the current MVP scope.

Possible future tasks:

- Generate product descriptions.
- Suggest modifier groups.
- Draft specials.
- Create printable menu copy.
- Assist menu import.
- Draft marketing/social copy.

AI usage should be optional, paid or usage-controlled later.

## Architecture Decisions

- One shared multi-tenant database is expected.
- Business-owned records use `business_id`.
- Location-specific records use `location_id` where appropriate.
- Businesses should not each get a separate database by default.
- Platform Admin / App Owner area will eventually manage businesses and locations.
- New businesses and locations should start in setup mode; new locations should have ordering disabled until explicitly activated.
- Product setup remains the foundation for everything else.
- Configurable product pricing must go through the shared `priceConfiguredProduct` resolver.
- Builders must not implement independent pricing math.
- Pizza half-topping pricing and included-slot behavior are business-level settings; missing rows default to half pricing on, half included-slot counting on, and `floor_to_cent` rounding.
- AI should not be part of the current sprint.
- Draft/publish versioning is future work, not a current product-entry blocker.

## Do Not Build Yet

These are intentionally deferred:

- Full draft/publish versioning.
- Full auth/role enforcement if not already implemented.
- Billing/subscriptions.
- AI Owner Copilot.
- Multiple builder visual layouts.
- `BundleBuilder` / `ComboBuilder`.
- Printable menu builder.
- Customer-facing AI.
