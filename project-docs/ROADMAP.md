# MenuPilot Roadmap

_Last updated: 2026-06-05_

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
- [x] Platform Admin business detail can update business activation status and location status/order flags.
- [x] Tenant resolver helpers exist for business/location context.
- [x] Tenant-aware business admin shell exists at `/businesses/[businessSlug]/admin` with setup sections for Product Catalog, Variants, Modifiers, Media, Customer Preview, and disabled future items.
- [x] Tenant-scoped Product Admin route shells exist at `/businesses/[businessSlug]/admin/products...`.
- [x] Tenant-scoped core product mutations exist for create, update, delete, enable/disable, and duplicate.
- [x] Tenant-scoped category/subcategory mutations exist for create, update, and enable/disable saves.
- [x] Tenant-scoped reusable variant group/option and product variant assignment/override mutations exist.
- [x] Tenant-scoped product Modifier Group assignment, included/default modifier, and variant-specific modifier availability/price mutations exist.
- [x] Tenant-scoped reusable Admin Modifier Library routes/actions exist for Modifier Categories, Modifier Groups, Modifier Option Groups/Lists, Modifier Options, safe deletes, option moves, and modifier option overrides reached from modifier detail pages.
- [x] Tenant-scoped Admin Media route/actions exist for media reads, uploads, URL imports, metadata edits, and selected-business storage paths.
- [x] Tenant-scoped public menu route exists at `/businesses/[businessSlug]/menu`; legacy `/menu` remains pointed at `pronto-demo`.
- [x] Business-scoped checkout route exists at `/businesses/[businessSlug]/checkout`; legacy `/checkout` remains pointed at Pronto Demo/main-street.
- [x] Location-scoped staff order route exists at `/businesses/[businessSlug]/locations/[locationSlug]/orders`; legacy `/staff/orders` remains pointed at Pronto Demo/main-street.

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

Specials should eventually support:

- Discount specials.
- Product/category eligibility.
- Bundle/meal-deal specials.
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
