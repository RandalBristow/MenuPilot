# Specials Engine

_Last updated: 2026-06-08_

## Current State

The Specials MVP schema, pure resolver, checkout integration, staff order discount display, tenant-scoped Specials Admin UI, public menu active-specials display, schema/type support for orderable deal components, Specials Admin component editing with optional component variant restrictions and modifier included-count overrides, tenant-scoped Mix & Match admin editing, a pure orderable deal validation/pricing helper, public DealBuilder runtime, checkout/order snapshots for orderable deals, staff nested deal display, and cart type/display support for nested orderable deal items exist. Cart discount previews are informational only; checkout remains authoritative.

The resolver lives in:

- `features/specials/utils/apply-specials-to-priced-cart.ts`

Checkout loads active specials through:

- `features/specials/queries/load-active-specials-for-checkout.ts`

Staff order display loads applied discount snapshots through:

- `features/staff-orders/queries/get-orders.ts`

Shared type/constants live in:

- `features/specials/types/special.ts`

Tenant-scoped admin routes live at:

- `/businesses/[businessSlug]/admin/specials`
- `/businesses/[businessSlug]/admin/specials/new`
- `/businesses/[businessSlug]/admin/specials/[specialId]`

## MVP Rule

Specials apply after configured-product pricing.

The shared configured-product pricing resolver remains responsible for product base price, variants, modifiers, included selections, defaults, placement, multiplier, and quantity. Specials consume the already server-validated/priced cart candidate.

Checkout now runs the Specials resolver after `validateAndPriceCart`. The order row stores:

- `orders.subtotal` as the configured-product subtotal before specials.
- `orders.discount_total` as the applied Specials discount.
- `orders.total` as subtotal minus discount.

Applied discounts are persisted to `order_discounts` after order items are inserted. Line-level discount snapshots are mapped from resolver line ids to the inserted `order_items.id`; cart-level discount snapshots store `order_item_id = null`.

Staff orders display the configured-product subtotal, discount total, final total, and applied discount snapshots when a discount exists. No-discount orders keep the compact existing display and do not show empty discount sections. Line-level discount snapshots are shown under the affected order item; cart-level discount snapshots are shown in an order-level discounts section.

Public menus display active specials in a compact Current Specials section and show product badges for eligible line-level or fixed-price line specials. Public display is informational only: disabled, expired, future, and inactive-now specials are hidden, and checkout still recalculates eligibility server-side before saving the order. Cart-level specials appear in the Current Specials section, not as product badges.

## Supported Special Types

- `line_discount`
- `fixed_price_line`
- `cart_discount`
- `orderable_deal`
- `mix_and_match_fixed_unit_price`

## Specials / Deals Roadmap

Implemented or mostly implemented:

- [x] `line_discount`: passive line discount against eligible normal cart lines.
- [x] `fixed_price_line`: passive fixed-price line special against eligible normal cart lines.
- [x] `cart_discount`: passive cart-level discount.
- [x] `orderable_deal`: customer-built parent deal item with required components and nested configured child products.
- [x] Recurring availability windows for enabled specials.
- [x] Variant restrictions for orderable deal component products.
- [x] Modifier Group included-count overrides for orderable deal component products.

Next planned:

- [~] `mix_and_match_fixed_unit_price`: schema/type foundation and tenant-scoped admin editing exist for choosing a minimum number of eligible products from one pool, with each selected pool item using the same fixed unit price. Runtime/checkout/public behavior remains pending.
- [ ] Category/subcategory component eligibility.
- [ ] BOGO.
- [ ] `free_item_with_purchase`.
- [ ] `discounted_add_on`.
- [ ] `coupon_code`.
- [ ] Usage limits: one per order, limited total redemptions, location-specific, and fulfillment-specific carryout/delivery.
- [ ] Tax/discount ordering rules.
- [ ] Customer/account-specific promos.

## Supported Discount Types

- `percentage`
- `fixed_amount`
- `fixed_price`

Unsupported special/discount combinations are ignored by the passive resolver. `orderable_deal` is not a passive discount. It can be built from the public menu into a nested cart item and checked out through parent/child order item snapshots. In Specials Admin, `orderable_deal` uses `fixed_price` and the discount value field is the deal base price.

## Orderable Deals

Orderable deals are future sellable Specials where the customer starts from the deal, chooses/configures required components, and adds one parent deal item to cart with nested child products. Examples include Family Deal, Any 2 Specialty Pizzas, and Lunch Combo.

Schema/type foundation exists for:

- `specials.special_type = 'orderable_deal'`
- `special_components` for deal component slots such as "Choose your first pizza" or "Choose your drink"
- `special_component_products` for exact selectable products inside each component
- `special_component_product_variant_options` for optional reusable variant option restrictions on a component product
- `special_component_modifier_group_overrides` for component/product-specific included Modifier Group counts
- `validateAndPriceOrderableDeal` for pure validation/pricing of an already-priced proposed deal selection

Passive eligibility tables remain separate:

- `special_products` and `special_menu_groups` are passive discount eligibility tables.
- `special_component_products` defines selectable products for orderable deal components.
- Do not reuse passive eligibility rows as component choices.

For the first runtime MVP, `orderable_deal` will use `specials.discount_value` as the deal base/fixed price unless a later migration adds `deal_base_price`. The current pure helper prices deal base price plus explicit child extras supplied by the caller, such as `childExtraTotal`, `modifierExtraTotal`, or `chargedModifierTotal`. If no child extra/upcharge field is supplied, the helper treats that child extra as zero for MVP.

The helper validates special type, business ownership, enabled/schedule/window status, component quantity rules, exact allowed product ids, child quantities, base price, and nonnegative child extras. It does not call Supabase, does not price configured products, and does not create `order_discounts`.

Specials Admin can create and edit `orderable_deal` records. The form hides passive eligibility fields for orderable deals, treats `discount_value` as the deal base price, and edits component slots with labels, descriptions, quantity rules, exact allowed product choices, optional reusable variant option restrictions, and optional included Modifier Group count overrides for each selected component product. If no variant restrictions are selected for a component product, every enabled variant for that product remains allowed. If no modifier included-count override is entered, the product's normal included Modifier Group rule is used. The component allowed-products picker can browse all selected-business products by menu category and subcategory, with per-subcategory select/clear actions. Component saves replace the saved component list for that deal. Category/subcategory component eligibility rules, exclusions, allowed/excluded modifier option rules, deal-specific default modifiers, and optional component pricing tables remain deferred.

Orderable deal modifier included-count overrides are deal-context only. They do not create new modifiers for the deal and do not change the product's normal Product Modifier Assignment. They override only the included selection count for a selected component product and assigned Modifier Group while that product is being configured inside that deal component. Example: a "Large 2-Topping Pizza" deal can select the normal Build Your Masterpiece product, restrict it to the large variant, and override Pizza Toppings included selections to `2` for that component. Outside the deal, Build Your Masterpiece keeps its normal included topping setup.

DealBuilder runtime exists for public menus. Active orderable deals show a Build Deal action, load exact component choices from `special_components` and `special_component_products`, and guide the customer through required component choices. Mobile keeps a step-by-step item wizard; larger screens show a wider product grid with a right-side deal summary panel. Each step shows only the products allowed for that component as image-backed cards with `Add to Deal` for default selections and `Customize` for child product configuration. DealBuilder passes any saved variant allow-list into `ProductConfigurator` return mode for child product configuration, validates the assembled selection with `validateAndPriceOrderableDeal`, shows a final review step, and adds one parent `DealCartItem` with nested component children to cart. Component choices are sorted by component/product sort order and filtered to the selected business.

Cart can now store and display one parent orderable deal item with nested component child products. Deal cart entries keep tenant metadata, deal base price, child extra total, parent total, component labels/quantity counts, child configured snapshots, and child modifier snapshots. Deal entries count as one cart line and are not editable through existing product builders.

ProductConfigurator and the existing product builders support two submit behaviors: default `cart` mode writes configured products to cart as before, while `return` mode returns a `ConfiguredProductResult` snapshot without mutating cart. DealBuilder uses return mode for component child selection.

Checkout validates orderable deal cart items server-side. It reloads the active deal, validates business ownership, schedule/window eligibility, component quantity rules, exact allowed child products, optional component product variant restrictions, optional component/product modifier included-count overrides, and each configured child product through the same server-side configured-product validation used for normal cart items. Client deal totals, child totals, client-visible variant choices, and client-visible modifier prices are not trusted; stale deal totals, child prices, or disallowed child variants cause checkout validation errors.

Orderable deal order snapshots use existing `order_items` relationships:

- parent deal row: `product_id = null`, `relationship_type = 'deal'`, `line_subtotal` equals deal base plus child extras, and `notes` stores the `specialId` snapshot as JSON.
- child component rows: `parent_order_item_id` points to the parent deal row, `relationship_type = 'deal_component'`, product/variant snapshots are stored normally, `line_subtotal` stores the child extra amount, and `notes` stores component id/label JSON.
- child modifiers are inserted against the child order item id so staff can see kitchen configuration.

Order subtotal includes normal top-level items plus the parent deal total only. Child rows are not used to calculate order subtotal, so their child-extra line subtotals do not double-count.

Passive specials apply only to normal configured top-level cart items in this MVP. Passive specials do not apply to deal parent rows or deal child rows, and orderable deal pricing itself does not create `order_discounts` rows.

Child edit/reconfigure behavior remains pending.

Deferred expansion tables include component menu-group eligibility, subcategory eligibility, exclusions, allowed/excluded modifier options, deal-specific default modifiers, premium modifier pricing rules, and optional component pricing tables.

## Mix-And-Match Fixed Unit Price Design

`mix_and_match_fixed_unit_price` exists at schema/type and tenant-scoped admin editing level. It is not runtime-enabled yet.

The core distinction is:

- `orderable_deal`: fixed/base deal price with named component slots, such as Component 1 pizza, Component 2 pizza, Component 3 bread, and Component 4 drink.
- `mix_and_match_fixed_unit_price`: one eligible product pool where the customer chooses at least a configured number of items, and every chosen pool item uses the same fixed unit price.

Examples:

- Any 2 eligible items for `$7.99` each.
- Any 2 or more eligible items for `$7.99` each.
- Any 3 subs for `$8.99` each.
- Any 2 eligible items for `$7.99` each plus a required 2-liter.

Recommended MVP behavior:

- Mix pool items use one fixed unit price.
- Minimum selected pool quantity is required.
- Maximum selected pool quantity is optional. If absent, the deal can repeat beyond the minimum.
- If minimum is 2 and the customer chooses 3, all 3 pool items are priced at the fixed unit price.
- If the business wants exactly 2, set max quantity to 2.
- Optional required side components, such as "Choose your 2-liter", should reuse existing orderable deal component rules in a later task.
- Side components are not supported in the current Mix & Match admin UI.
- Passive specials should not stack on mix-and-match parent or child items by default.

Current schema/admin foundation:

- `special_type = 'mix_and_match_fixed_unit_price'` is allowed by the database and shared Special types.
- `special_mix_match_rules` stores one rule per mix-and-match special:
  - `id`
  - `business_id`
  - `special_id`
  - `min_quantity`
  - `max_quantity`
  - `unit_price`
  - `allow_extra_items`
  - `created_at`
  - `updated_at`
- `special_mix_match_products` stores exact products eligible for the mix pool.
- `special_mix_match_product_variant_options` stores optional reusable variant option restrictions for mix pool products. No rows means all enabled variants should be allowed when runtime is built.
- `special_mix_match_modifier_group_overrides` stores optional Modifier Group included-count overrides for mix pool products. No row means the product's normal included rule should be used when runtime is built.
- Specials Admin can create/edit Mix & Match records and saves to `special_mix_match_rules`, `special_mix_match_products`, `special_mix_match_product_variant_options`, and `special_mix_match_modifier_group_overrides`. Runtime/checkout/public menu behavior remains deferred.

The current foundation intentionally uses dedicated mix pool tables instead of overloading fixed-slot `special_components`. Existing orderable deal components remain available for future attached side components, such as "Choose your 2-liter".

Admin UI:

- Special type: `Mix & Match`.
- Fields: deal name, internal/customer descriptions, enabled state, date range, recurring availability, unit price, minimum item count, optional maximum item count, allow-extra-items flag, exact eligible product pool, optional reusable variant restrictions, and optional Modifier Group included-count overrides.
- Eligible product pool uses the current category/subcategory grouped product picker, filtered to real product categories.
- Each selected pool product can have optional reusable variant restrictions and optional Modifier Group included-count overrides.
- Required side components are intentionally not supported in Mix & Match admin editing yet. "Any 2 for $7.99 each and a 2-liter" needs a later side-component task before it can be modeled fully.

Public builder design:

- Customer opens the mix-and-match deal.
- Step 1 shows the eligible pool and selected item count, such as `0 of 2 selected`.
- Customer can add default selections or customize each selected product through existing product builders.
- Review shows selected pool item count, fixed unit price, child extras, optional side components, and total.
- For deals with side components, the flow becomes:
  - choose at least the required pool count
  - choose/configure required side components
  - review

Checkout validation design:

- Reload the special, schedule, mix rule, eligible pool products, optional side components, variant restrictions, and modifier overrides server-side.
- Validate business ownership and active availability.
- Validate selected pool products are allowed.
- Validate selected variants are allowed when restrictions exist.
- Validate selected pool quantity is at least minimum and no more than max when max exists.
- Reprice every child configured product server-side using existing configured-product validation.
- Apply deal-context modifier included-count overrides before pricing each child.
- Mix total equals selected eligible pool item count times unit price, plus child extras and side component extras.
- Ignore client-provided deal totals.
- Exclude passive discounts from mix-and-match items in the first MVP.

Cart, order, and staff display design:

- Use the same nested deal cart shape: one parent deal item with nested children.
- Add enough metadata to distinguish mix pool children from fixed side component children.
- Parent display should show special name, fixed unit price summary, selected count, extras, and total.
- Staff display should show the parent deal, nested selected products, modifier details, unit-price summary, and total.

Do not build in the first mix-and-match MVP:

- Category/subcategory eligibility.
- Exclusions.
- BOGO.
- Free-item rewards.
- Coupon codes.
- Usage limits.
- Different fixed unit prices per product.
- Auto-adding missing required components.
- Passive discount stacking on deal items.
- Inventory constraints.

### Exact Next Build Prompt

Follow `project-docs/DEV_RULES.md`, `project-docs/CODEX_INSTRUCTIONS.md`, `project-docs/UI_GUIDELINES.md`, `project-docs/PROJECT_STATE.md`, `project-docs/AI_HANDOFF.md`, `project-docs/ROADMAP.md`, and `project-docs/SPECIALS_ENGINE.md`.

Task: Add tenant-scoped Specials Admin UI support for editing Mix-and-Match fixed unit price schema records.

Scope:

- Work in tenant-scoped Specials Admin form/actions/queries/tests and docs.
- Do not build public DealBuilder runtime for Mix-and-Match.
- Do not change checkout behavior.
- Do not change cart/order/staff behavior.
- Do not build BOGO, coupons, free item rewards, usage limits, category/subcategory eligibility, exclusions, or different unit prices per product.

Requirements:

- Allow Specials Admin to create/edit `mix_and_match_fixed_unit_price` records.
- Add form fields for unit price, minimum quantity, optional maximum quantity, allow extra items, exact eligible products, optional variant restrictions, and optional Modifier Group included-count overrides.
- Save to `special_mix_match_rules`, `special_mix_match_products`, `special_mix_match_product_variant_options`, and `special_mix_match_modifier_group_overrides`.
- Preserve existing passive special and `orderable_deal` behavior.
- Update Specials docs and roadmap.
- Run `npm run test`, `npx tsc --noEmit`, and targeted ESLint for changed Specials files.

## Stacking

MVP specials do not stack.

The resolver evaluates every active eligible special independently and chooses the single special with the highest discount total. One selected line-level special may apply to multiple eligible cart lines. If two specials produce the same discount total, the resolver uses the lexicographically smaller special id as the deterministic tie-breaker.

## Eligibility

Specials must:

- be enabled
- match the current business
- be inside the schedule window
- have a positive discount value

Schedule rules:

- `startsAt = null` means no lower bound.
- `endsAt = null` means no upper bound.
- No recurring availability windows means the special is available any day/time inside the date range.
- Recurring availability windows use `day_of_week` values `0` Sunday through `6` Saturday.
- For MVP, non-all-day windows must have `start_time < end_time`; overnight windows are not supported.
- Checkout evaluates recurring windows using the resolved location timezone.

Admin status rules:

- Disabled: `is_enabled = false`.
- Scheduled: enabled, with a future start date/time.
- Active: enabled and currently eligible by date range plus recurring windows.
- Expired: enabled, with an end date/time in the past.
- Inactive now: enabled and inside the date range, but outside the current recurring window.

Expired specials remain saved and visible in admin so they can be reused later. They are not automatically disabled or deleted.

Line-level specials may target products, menu groups, or product plus reusable variant option. If a line-level special has no product or menu group eligibility rows, it applies to all cart lines for the business.

Cart discounts apply to the full cart subtotal when the minimum order amount rule passes. A cart discount with no eligibility rows applies to the full cart.

## Money Rules

Discount amounts are rounded to cents and capped so:

- line discounts never exceed the line subtotal
- cart discounts never exceed the order subtotal
- final order total never goes below zero

## Pending Work

- Cart special previews beyond the checkout informational note.
- Child edit/reconfigure behavior for cart deal items.
- Coupon UI.
- BundleBuilder/ComboBuilder.
- BOGO, mix-and-match, free-item rewards, usage limits, and category/subcategory component eligibility.

Checkout currently maps product id, selected reusable variant option id, quantity, and validated line subtotal into the resolver. Menu group eligibility exists in schema/resolver, but checkout does not pass menu group ids yet because validated checkout product config does not currently carry menu placement.
