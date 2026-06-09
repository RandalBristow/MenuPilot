# Tenant Onboarding Regression

_Last updated: 2026-06-08_

This checklist proves a brand-new business can be created, configured, activated, ordered from, and viewed in staff orders without relying on the seeded `pronto-demo` / `main-street` tenant.

Use this before deciding whether to wipe/rebuild the development database.

## Result Legend

- [ ] Not tested
- [x] Passed
- [!] Failed / needs fix
- [D] Deferred by current roadmap

Record test business values:

- Business name:
- Business slug:
- Location name:
- Location slug:
- Test date:
- Tester:

## A. Platform Admin

- [ ] Open `/platform`.
- [ ] Open `/platform/businesses`.
- [ ] Create a new business at `/platform/businesses/new`.
- [ ] Create the first location in the same flow.
- [ ] Confirm the created business detail page loads at `/platform/businesses/[businessId]`.
- [ ] Confirm business starts with status `setup`.
- [ ] Confirm location starts with status `setup`.
- [ ] Confirm location starts disabled.
- [ ] Confirm location starts not accepting orders.
- [ ] Confirm pickup and delivery are disabled by default.
- [ ] Confirm the business has a default `Main Menu` scaffold for product category setup.

Expected result:

- New tenant exists in the shared database.
- Business-owned records use the new `business_id`.
- First location uses the new `location_id`.
- Default product menu/catalog scaffold uses the new `business_id`.
- No public ordering is live immediately after creation.

## B. Tenant Admin Context

- [ ] From Platform business detail, click `Open Business Admin`.
- [ ] Confirm URL is `/businesses/[businessSlug]/admin`.
- [ ] Confirm the page shows `Managing: {Business Name}`.
- [ ] Confirm business slug shown in the admin context is the new business slug.
- [ ] Confirm `Back to Platform` returns to the Platform business detail.
- [ ] Confirm `Switch Business` returns to `/platform/businesses`.
- [ ] Confirm Product Catalog links stay under `/businesses/[businessSlug]/admin/products...`.
- [ ] Confirm Variant links stay under `/businesses/[businessSlug]/admin/products...`.
- [ ] Confirm Modifier links stay under `/businesses/[businessSlug]/admin/modifiers...`.
- [ ] Confirm Specials link stays under `/businesses/[businessSlug]/admin/specials...`.
- [ ] Confirm Media link stays under `/businesses/[businessSlug]/admin/media`.
- [ ] Confirm Pizza Pricing Settings show half-topping pricing and half included-slot counting enabled by default.
- [ ] Save Pizza Pricing Settings and confirm a themed toast appears.
- [ ] Confirm Locations / Orders link points to `/businesses/[businessSlug]/locations/[locationSlug]/orders` when the location exists.

Expected result:

- Tenant context is explicit in the URL.
- Admin actions are performed in the selected business context, not the seeded demo context.

## C. Business Activation

Before activation:

- [ ] Visit `/businesses/[businessSlug]/checkout`.
- [ ] Confirm checkout is blocked because the business/location is setup or not orderable.

Activate:

- [ ] Return to `/platform/businesses/[businessId]`.
- [ ] Change business status to `active` and save.
- [ ] Change location status to `active` and save.
- [ ] Enable the location and save.
- [ ] Enable pickup and save.
- [ ] Enable accepting orders and save.
- [ ] Leave delivery disabled unless delivery is intentionally being tested.

After activation:

- [ ] Confirm `/businesses/[businessSlug]/admin` shows the default location as checkout-ready.
- [ ] Confirm `/businesses/[businessSlug]/checkout` is no longer blocked when the cart is valid.
- [ ] Pause the business or location.
- [ ] Confirm checkout blocks again.
- [ ] Reactivate the business/location before continuing product/order tests.

Expected result:

- Checkout requires active business status plus active, enabled, accepting-orders location with pickup or delivery enabled.
- Setup or paused business/location can still be managed in admin.

## D. Product Catalog Setup

Using `/businesses/[businessSlug]/admin/products...`:

- [ ] Create a top-level product category.
- [ ] If the business was created before the default-menu fix, confirm the first category save repairs the missing `Main Menu` without a runtime error.
- [ ] Create a product subcategory.
- [ ] Create a product in the selected business.
- [ ] Edit the product.
- [ ] Duplicate the product.
- [ ] Confirm duplicated product is disabled by default.
- [ ] Enable and disable a product.
- [ ] Confirm product list shows only products for the selected business.
- [ ] Confirm Pronto/demo products do not appear in the selected business product list.
- [ ] Confirm legacy `/admin/products...` still works for Pronto demo compatibility.

Expected result:

- Product records are scoped to selected `business_id`.
- Product categories are attached to the selected business's `Main Menu`, not the seeded demo menu.
- Product route links remain in the scoped route family.

## E. Variant Setup

Using `/businesses/[businessSlug]/admin/products/variant-groups` and related product assignment routes:

- [ ] Create a reusable variant group.
- [ ] Create variant options.
- [ ] Edit variant option labels/prices/sort order.
- [ ] Assign the variant group to a product.
- [ ] Set product-specific variant option overrides.
- [ ] Confirm variant assignment appears only for the selected business.
- [ ] Confirm another business cannot see or edit this variant group from scoped routes.

Expected result:

- Reusable variants are business-scoped setup.
- Product-specific variant differences live in overrides/assignments.

## F. Modifier Library Setup

Using `/businesses/[businessSlug]/admin/modifiers...`:

- [ ] Create a Modifier Category.
- [ ] Create a Modifier Group.
- [ ] Set Modifier Group selection rules.
- [ ] Confirm selecting a top-level Modifier Category shows child subgroups or a clear empty state with footer Back/Add actions.
- [ ] Create a Modifier Option Group/List.
- [ ] Create Modifier Options.
- [ ] Verify Modifier Option sort order is scoped within the current Modifier Option Group/List.
- [ ] Move an option between option groups inside the same Modifier Group.
- [ ] Safe-delete an unused option.
- [ ] Confirm safe-delete is blocked for an option still in use.
- [ ] Confirm selected business sees only its own Modifier Categories, Groups, Option Groups, and Options.
- [ ] Confirm legacy `/admin/modifiers...` still works for Pronto demo compatibility.

Expected result:

- Modifier hierarchy is maintained: Modifier Category -> Modifier Group -> Modifier Option Group -> Modifier Option.
- No ungrouped Modifier Options are created during normal admin use.

## G. Product Modifier Setup

Using `/businesses/[businessSlug]/admin/products/modifier-groups` and related availability routes:

- [ ] Attach a Modifier Group to a product.
- [ ] Open the assigned Modifier Group's availability/defaults flow.
- [ ] Set default modifier options.
- [ ] Set included selections for that Modifier Group.
- [ ] Create a product with 5 defaults and 0 included selections.
- [ ] Confirm the defaults-vs-included warning appears on the Product Modifier Assignments card.
- [ ] Open included settings for the assigned Modifier Group.
- [ ] Confirm the warning also appears in the included settings sheet.
- [ ] Set included selections to 5.
- [ ] Confirm the warning disappears.
- [ ] Set variant-specific modifier availability.
- [ ] Set variant-specific modifier price override.
- [ ] Confirm the selected business only sees and edits its own product/modifier setup.

Expected result:

- Warning is informational only and does not block saves.
- Defaults consume included selections.
- Pricing behavior is unchanged and remains centralized in `priceConfiguredProduct`.

## H. Media Setup

Using `/businesses/[businessSlug]/admin/media` and product edit pages:

- [ ] Upload a media asset.
- [ ] Import a media asset by URL.
- [ ] Confirm media list shows the selected business asset.
- [ ] Confirm media storage path uses the selected business id.
- [ ] Edit media metadata.
- [ ] Select media as a product image.
- [ ] Confirm product image appears in the selected business product/menu flow.
- [ ] Confirm Pronto/demo media does not appear in the selected business media picker/list.
- [ ] Confirm legacy `/admin/media` still works for Pronto demo compatibility.

Expected result:

- Media reads/writes/uploads are scoped to selected business.
- Product images reference selected business media through `image_media_id`.

## H2. Specials Setup

Using `/businesses/[businessSlug]/admin/specials`:

- [ ] Create a disabled line discount special.
- [ ] Enable the special.
- [ ] Create a cart discount special with a minimum order amount.
- [ ] Create a lunch-window special and confirm its computed status reflects the current local time.
- [ ] Create a holiday/date-range special with a past end date and confirm it remains visible as expired.
- [ ] Confirm expired specials are not auto-disabled or deleted.
- [ ] Confirm selected products/categories are scoped to the selected business.
- [ ] Confirm an active special applies at checkout.
- [ ] Confirm an expired or currently inactive special does not apply at checkout.
- [ ] Confirm staff orders show applied discount snapshots after checkout.
- [ ] Create an orderable deal, set its deal base price, add component slots, and select exact allowed products for each component from multiple product categories/subcategories, such as Pizza, Drinks, and Breads.
- [ ] For a component product with variants, restrict it to one variant option, such as `2 Liter` or a large pizza size, and confirm the form reloads that restriction.
- [ ] For a component product with no variant restriction selected, confirm all enabled variants remain available.
- [ ] For a pizza component product, set a Modifier Group included-count override, such as Pizza Toppings = 2, and confirm the form reloads that override.
- [ ] Set an orderable deal pizza component to `Fixed component price`, enter `7.99`, save, reopen, and confirm the pricing mode and fixed price reload.
- [ ] Set an orderable deal drink component to `Included/free`, save, reopen, and confirm the fixed price field stays hidden/blank.
- [ ] Confirm the admin setup for "Two Large 2-Topping Pizzas for $7.99 each with a free 2-liter" uses three orderable deal components: Pizza 1 fixed price 7.99, Pizza 2 fixed price 7.99, and Soda included/free. Do not put the soda into a flat Mix & Match pool.
- [ ] Edit the orderable deal and confirm saved components and product choices reload correctly.
- [ ] Confirm the public menu shows a Build Deal action for the active orderable deal.
- [ ] Build the component-priced deal, confirm the builder cycles Pizza 1 -> Pizza 2 -> Soda, confirm pizza components show fixed `$7.99`, confirm the soda shows included/free, confirm child customization sticky totals show fixed/included component pricing plus extras instead of the normal product base price, confirm restricted products only show allowed variants, confirm the component modifier included-count override affects only the deal child pricing, and add one nested deal item to cart.
- [ ] Confirm the cart shows nested children with fixed/included component pricing and that two fixed `$7.99` pizzas plus an included/free soda totals `$15.98` before extras.
- [ ] Submit checkout with the component-priced orderable deal and confirm checkout succeeds at `$15.98` before extras.
- [ ] Submit checkout with a legacy/base-price orderable deal cart item that does not use component pricing modes.
- [ ] Confirm checkout rejects a stale/tampered deal cart item that uses a disallowed component product variant.
- [ ] Confirm checkout recalculates deal child modifier pricing using server-loaded component included-count overrides and ignores stale client child prices.
- [ ] Confirm order total equals fixed/included component base totals plus child extras.
- [ ] Confirm staff orders show the deal parent, nested child product configurations, and fixed/included component pricing copy.
- [ ] Confirm passive discounts do not discount the deal item.
- [x] Mix-and-match fixed unit price schema/type foundation, admin editing, public runtime, cart-add behavior, checkout validation, order snapshots, and staff nested display exist.
- [ ] Create an active Mix & Match deal, build it from the public menu, add default and customized pool products, confirm one nested parent cart item is created, confirm checkout accepts valid Mix items and rejects stale totals, and confirm staff orders show the nested Mix parent/children.

Expected result:

- Specials are reusable business-owned setup records.
- Checkout applies only currently eligible enabled specials.
- Expired specials remain available for later reuse.
- Orderable deals can be built into cart and checked out through parent/child order item snapshots.
- Optional orderable deal component variant restrictions are enforced in DealBuilder and checkout; no restriction means all enabled variants are allowed.
- Optional orderable deal component modifier included-count overrides apply only inside that deal component; normal product modifier setup outside the deal is unchanged.
- Mix-and-match checkout/order/staff support remains deferred until the server validation and snapshot path is built.

## I. Public Menu Preview

Using `/businesses/[businessSlug]/menu`:

- [ ] Visit scoped public menu before activation.
- [ ] Confirm setup/preview messaging appears when business status is `setup`.
- [ ] Confirm ordering actions are disabled while setup.
- [ ] Confirm Pronto/demo products do not appear.
- [ ] Activate business/location and ordering flags.
- [ ] Visit scoped public menu again.
- [ ] Confirm active business displays orderable menu.
- [ ] Confirm product configurator opens for configured products.
- [ ] For pizza, confirm left/right toppings use half price and count as half an included selection when the business setting is enabled.
- [ ] Confirm product images load from selected business media.

Expected result:

- Public menu reads selected business data only.
- Setup businesses can be previewed without implying real ordering is live.

## J. Cart / Checkout

Using `/businesses/[businessSlug]/menu` and `/businesses/[businessSlug]/checkout`:

- [ ] Add a pizza/configurable item.
- [ ] Add a simple quantity-only item.
- [ ] Add a variant-only item if available.
- [ ] Confirm cart checkout link points to `/businesses/[businessSlug]/checkout`.
- [ ] Confirm scoped checkout shows selected business/location context.
- [ ] Confirm scoped checkout blocks stale or cross-tenant cart items.
- [ ] Submit a pickup order.
- [ ] Confirm order succeeds.
- [D] Future quick 86 / temporarily sold out products/options should be unavailable in menu and rejected by checkout.
- [ ] Confirm order uses selected `business_id`.
- [ ] Confirm order uses selected `location_id`.
- [ ] Confirm server-side pricing is authoritative by checking totals against the configured product rules.
- [ ] Confirm cart clears after successful order.

Expected result:

- Checkout ignores stale/tampered client prices.
- Order creation uses resolved business/location context, not hidden ids alone.
- Legacy `/checkout` remains Pronto demo/main-street until intentionally retired.

## K. Staff Orders

Using `/businesses/[businessSlug]/locations/[locationSlug]/orders`:

- [ ] Visit scoped location staff orders route.
- [ ] Confirm selected business and location names are shown.
- [ ] Confirm submitted order appears.
- [ ] Accept the order.
- [ ] Mark preparing.
- [ ] Mark ready.
- [ ] Mark completed.
- [D] Future customer-facing order status page should reflect staff status changes without exposing private order data.
- [D] Future staff-entered / phone orders should create tenant/location-scoped orders that appear only in this staff route.
- [D] Future realtime staff orders should show new/status-changed orders without manual refresh.
- [D] Future staff order detail should make customer/order notes and special instructions prominent.
- [ ] Confirm status changes affect only the selected business/location order.
- [ ] Confirm an order from another business/location does not appear.
- [ ] Confirm mismatched business/location route returns not found.

Expected result:

- Staff reads filter by `business_id` and `location_id`.
- Status updates resolve business/location slugs server-side and verify order ownership.

## L. Legacy Demo Safety

Legacy routes intentionally remain for Pronto demo compatibility:

- [ ] `/menu` still loads seeded Pronto Demo menu.
- [ ] `/checkout` still uses Pronto Demo/main-street.
- [ ] `/staff/orders` still shows Pronto Demo/main-street staff queue.
- [ ] `/admin/products...` still works for Pronto demo product admin.
- [ ] `/admin/modifiers...` still works for Pronto demo modifier admin.
- [ ] `/admin/media` still works for Pronto demo media admin.
- [ ] Work under the new tenant does not mutate Pronto Demo products.
- [ ] Work under the new tenant does not mutate Pronto Demo modifiers.
- [ ] Work under the new tenant does not mutate Pronto Demo media.
- [ ] Orders placed under the new tenant do not appear in `/staff/orders`.

Expected result:

- Legacy demo compatibility remains intact until intentionally retired.
- New tenant regression can prove the app no longer depends on `pronto-demo` for scoped flows.

## Readiness Audit

| Area | Status | Evidence | Manual verification needed |
| --- | --- | --- | --- |
| Platform Admin | Implemented | `/platform`, `/platform/businesses`, `/platform/businesses/new`, `/platform/businesses/[businessId]`; `features/platform-admin` create/detail/activation actions. | Full create-business and first-location browser pass. |
| Tenant resolver | Implemented | `features/tenant/queries/resolve-business-context.ts`, `resolve-location-context.ts`, tenant context tests. | Verify unknown/mismatched slugs return not found in browser. |
| Products | Implemented, needs manual verification | Tenant product routes under `/businesses/[businessSlug]/admin/products...`; scoped product action tests. | Create/edit/duplicate/enable product under a new business and verify isolation. |
| Variants | Implemented, needs manual verification | Tenant-scoped variant group and assignment routes/actions/tests. | Create reusable variant group/options, assign to product, set overrides. |
| Modifiers | Implemented, needs manual verification | Tenant-scoped modifier library routes/actions/tests; option move/safe delete support. | Create hierarchy, move option, safe-delete unused option, verify isolation. |
| Media | Implemented, needs manual verification | `/businesses/[businessSlug]/admin/media`; media action tests; selected-business storage paths. | Upload/import media and confirm selected business ownership/path. |
| Specials | Implemented orderable-deal and Mix & Match MVPs need manual verification | `/businesses/[businessSlug]/admin/specials...`; specials action/query/status tests; checkout loader schedule tests; orderable deal component editing tests; Mix & Match admin/runtime/checkout tests. | Create active, disabled, expired, lunch-window, orderable deal, and Mix & Match admin records; confirm checkout/staff behavior for supported passive/orderable/Mix deal flows; confirm Mix & Match can add to cart, checkout, persist nested order rows, and display in staff orders. |
| Public menu | Implemented, needs manual verification | `/businesses/[businessSlug]/menu`; scoped menu query tests. | Confirm setup preview, active menu, and no Pronto products. |
| Checkout | Implemented, needs manual verification | `/businesses/[businessSlug]/checkout`; checkout tenant context/order action tests. | Submit real order from scoped cart and confirm business/location IDs. |
| Staff orders | Implemented, needs manual verification | `/businesses/[businessSlug]/locations/[locationSlug]/orders`; scoped staff query/action tests. | Confirm order appears and status updates remain scoped. |
| Activation controls | Implemented, needs manual verification | Platform business detail controls; activation action tests; checkout orderability tests. | Activate/pause business/location and confirm checkout blocks/unblocks. |
| Defaults/included warning | Implemented, needs manual verification | `getDefaultModifierIncludedSelectionWarnings`; Product Modifier Assignments UI/test. | 5 defaults + 0 included warning appears; included 5 removes it. |
| Legacy demo compatibility | Implemented, intentionally retained | Legacy constants/fallbacks exist in menu, checkout, staff, product/modifier/media admin context helpers. | Confirm legacy routes still work and new tenant changes do not mutate Pronto data. |
| Auth/role protection | Deferred intentionally | Docs mark Platform/Admin/Staff auth protection as deferred. | Do not expose Platform Admin publicly until auth is built. |
| Checkout transaction/RPC | Known gap | Checkout creates order/items with server validation but still lacks transaction/RPC pattern. | Acceptable for manual regression; fix before real payment launch. |
| Stripe/payment automation | Deferred intentionally | Payment/webhook work remains roadmap future. | Not required for new-tenant pickup order regression. |

## Blocker Audit Before Clean Rebuild

No code blocker is currently known for running the new-tenant manual regression.

Known remaining risks before a clean database rebuild:

- Manual browser regression has not passed yet.
- Legacy demo fallbacks still exist intentionally for `/menu`, `/checkout`, `/staff/orders`, `/admin/products...`, `/admin/modifiers...`, and `/admin/media`.
- Auth/role protection is deferred; Platform Admin must remain internal.
- Checkout order creation still needs a transaction/RPC pattern before real payment use.
- Stripe/payment automation is deferred.
- Full draft/publish, rich specials cart preview, child deal reconfigure behavior, website builder, delivery, and billing are intentionally out of scope.

Clean database rebuild recommendation:

- Ready for manual tenant onboarding regression.
- Not ready to wipe/rebuild until every section in this document passes or has a documented accepted exception.
- After the manual pass, it is reasonable to decide whether to retire/redirect legacy demo routes or keep them as explicit compatibility routes through the rebuild.
