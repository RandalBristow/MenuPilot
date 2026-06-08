# Database

_Last updated: 2026-06-08_

All schema changes must be made through files in `database/migrations/`.

## Migration History

| Migration | Purpose |
| --- | --- |
| `001_initial_schema.sql` | Core multi-business, location, menu, product, modifier, order, charge, payment, media, page, theme, and foundational tables. |
| `002_rls_policies.sql` | Initial RLS policy foundation. |
| `003_seed_data.sql` | Seeded Pronto Demo Pizza & Carryout demo data. |
| `004_modifier_option_groups.sql` | Adds option-group structure under modifier groups. |
| `005_seed_modifier_option_groups.sql` | Seeds modifier option group data. |
| `006_modifier_group_categories.sql` | Adds Modifier Categories in `modifier_categories` for admin organization. |
| `007_reusable_variant_groups.sql` | Adds reusable variant groups/options, product assignments, and variant option overrides. |
| `008_remove_product_variants.sql` | Removes the older product-specific variant table after reusable variants replaced it. |
| `009_one_enabled_variant_group_per_product.sql` | Enforces one enabled variant group per product. |
| `010_product_variant_modifier_option_availability_rules.sql` | Adds variant-specific modifier option availability rules. |
| `011_product_modifier_option_overrides.sql` | Adds per-product modifier option overrides. |
| `012_rename_modifier_group_categories.sql` | Renames the old Modifier Category table/foreign key to `modifier_categories` and `modifier_category_id` for existing databases. |
| `013_order_snapshot_reusable_ids.sql` | Adds reusable variant/modifier IDs to order item snapshots. |
| `014_product_default_modifier_option_settings.sql` | Adds placement, multiplier, enabled, sort, and uniqueness settings for product default modifier options. |
| `015_product_variant_modifier_option_price_overrides.sql` | Adds variant-specific modifier option price overrides for reusable variants. |
| `016_backfill_required_modifier_option_groups.sql` | Backfills Modifier Option Groups/Lists for seeded options that were created directly under Modifier Groups and removes placeholder pizza sauce seed options. |
| `017_platform_onboarding_defaults.sql` | Adds minimal Platform Admin onboarding schema support: business primary contact fields, location status, and setup-safe defaults for new businesses/locations. |
| `018_business_pricing_settings.sql` | Adds one business-level pricing settings row for pizza half-topping pricing and included-slot behavior. |
| `019_specials_mvp.sql` | Adds business-scoped Specials MVP tables for future line discounts, fixed-price line specials, cart discounts, eligibility, and order discount snapshots. |
| `020_special_availability_windows.sql` | Adds business-scoped recurring day/time availability windows for reusable specials. |
| `021_orderable_deal_components.sql` | Adds schema/type support for future orderable deal specials with components and exact allowed product choices. |
| `022_orderable_deal_variant_restrictions.sql` | Adds optional reusable variant option restrictions for orderable deal component products. |
| `023_orderable_deal_modifier_overrides.sql` | Adds optional orderable deal component/product Modifier Group included-count overrides. |
| `024_mix_and_match_specials.sql` | Adds schema/type foundation for Mix-and-Match fixed unit price specials, exact mix-pool product eligibility, variant restrictions, and Modifier Group included-count overrides. |

## Core Tenant Tables

- `profiles`
- `businesses`
- `business_users`
- `locations`
- `location_users`
- `location_hours`
- `location_hour_overrides`

The app is designed for multiple businesses and locations, but the current demo flows still use seeded Pronto Demo records.

Current architecture decision:

- One shared multi-tenant database is expected.
- Business-owned records use `business_id`.
- Location-specific records use `location_id` where appropriate.
- Businesses should not each get a separate database by default.
- Platform Admin / App Owner tooling should eventually create businesses and first locations before a clean development rebuild.
- Before a clean database rebuild, public menu, checkout, staff, and admin data access should use a central tenant context resolver instead of hardcoded seeded demo business/location assumptions.

Platform Admin onboarding schema support:

- `businesses` includes optional `primary_contact_name`, `primary_contact_email`, and `primary_phone` fields.
- `businesses.status` defaults to `setup` for newly-created businesses.
- `locations.status` defaults to `setup` for newly-created locations.
- New locations default to ordering disabled: `is_enabled = false`, `accepting_orders = false`, `pickup_enabled = false`, and `delivery_enabled = false`.
- Platform Admin business creation creates the default `Main Menu` row in `menus` needed before product categories can be created.
- Existing businesses keep their current status, and existing locations are marked `active` when the location status column is introduced so demo data is not accidentally treated as setup data.
- Expected status values for MVP are `setup`, `active`, `paused`, and `archived`; these are documented conventions, not strict database constraints yet.
- Full auth/role enforcement remains deferred.

Business pricing settings:

- `business_pricing_settings` stores business-level pizza half-topping settings.
- `pizza_half_topping_pricing_enabled` defaults to `true`; left/right pizza toppings charge half the effective modifier price.
- `pizza_half_topping_included_weight_enabled` defaults to `true`; left/right pizza toppings consume 0.5 included selections.
- `pizza_half_topping_rounding_mode` defaults to `floor_to_cent`; pricing floors after placement weight and multiplier are applied.
- Existing businesses without a row use the same defaults through the shared pricing settings normalizer.

## Menu And Product Tables

- `menus`
- `menu_groups`
- `products`
- `product_groups`
- `product_location_overrides`
- `media_assets`

`products` are the sellable items. `menu_groups` are customer/admin-facing product categories and subcategories. `product_groups` assigns products into menu groups.

Each business needs a default product menu row in `menus` for product category setup. The current convention is one business-level `Main Menu` with `location_id = null`, `menu_type = online`, `is_enabled = true`, and `sort_order = 1`. Platform Admin creates this scaffold for new businesses, and product category/subcategory saves defensively create it for existing fresh tenants that are missing it.

Product images are selected from Media Library records. Products reference images through `products.image_media_id`, which points to `media_assets`.

## Reusable Variant Tables

- `variant_groups`
- `variant_group_options`
- `product_variant_groups`
- `product_variant_option_overrides`

Variants are reusable structures for size/count/portion choices. Products attach a reusable variant group, then product-specific behavior is stored as overrides.

Current behavior:
- Reusable variant groups can be listed and edited.
- Products can attach/detach variant groups.
- One enabled variant group per product is enforced.
- Product overrides can change option price, enabled/default state, and sort order.

## Modifier Tables

Current terminology:

- `modifier_categories` = Modifier Categories, the admin organization layer.
- `modifier_groups` = Modifier Groups, the product-attached rule sets.
- `modifier_option_groups` = Modifier Option Groups, buckets inside Modifier Groups.
- `modifier_options` = Modifier Options, the selectable customer choices.

Assignment and override tables:

- `product_modifier_groups` attaches Modifier Groups to products.
- `product_modifier_option_overrides` stores product-specific option price, prep-time, enabled, and sort overrides.
- `product_variant_modifier_option_availability_rules` controls option availability by selected variant option.
- `product_variant_modifier_option_price_overrides` controls option price by selected variant option.

Modifier option price priority is:

1. enabled `product_variant_modifier_option_price_overrides.price_delta`
2. `product_modifier_option_overrides.price_delta_override`
3. global `modifier_options.price_delta`

Products do not attach Modifier Categories, Modifier Option Groups, or individual Modifier Options directly except through product-specific override/availability systems.

Existing foundation tables:

- `product_modifier_option_price_rules`
- `product_modifier_option_availability_rules`
- `modifier_option_dependency_rules`
- `product_included_modifier_groups`
- `product_default_modifier_options`
- `product_related_items`

Some of these foundation tables exist before their full admin UI is built.

## Orders, Charges, And Payments

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_discounts`
- `charges`
- `order_charges`
- `payments`

Checkout currently validates/reprices cart contents server-side, then creates unpaid pickup orders with item and modifier snapshots. Stripe payment records/webhooks are planned but not implemented.

`orders.discount_total` stores the total applied discount amount. `order_discounts` stores applied discount snapshots for future Specials Engine integration. A null `order_item_id` means the discount was applied at the order level; a non-null `order_item_id` means the discount was applied to a specific order item.

Known order-system gaps:
- Order creation should be moved to a transaction/RPC-style pattern.
- Auth/role enforcement needs to be applied to staff/admin access.

## Content And Theme Foundation

The initial schema also includes foundation for public media and future website/page/theme work:

- media assets, currently managed through `/admin/media`
- pages
- page sections
- navigation
- themes/theme tokens or related theme tables

These are not the current build focus.

Draft/publish/versioning is a future structural layer after specials MVP and before real customer launch. Prefer real version records over only scattered `is_published` flags, with both a version number and published timestamp. Versioning should eventually apply beyond products, including categories, variants, modifiers, pricing rules, defaults, included rules, specials, media selections, printable menus, and future homepage/menu display settings.

## Current Modeling Rule

Reusable configuration should follow this pattern:

1. Define reusable records globally.
2. Attach reusable records to products.
3. Store product-specific differences in override tables.
4. Clean up assignment-scoped overrides when assignments are removed.
5. Keep unassigned reusable objects view-only from product context.

Product setup remains the foundation for specials, printable menus, draft/publish/versioning, and later AI-assisted owner/admin tools.

## Specials MVP Schema

Specials are business-scoped. The MVP schema supports:

- `specials` for reusable special definitions.
- `special_products` for product and optional reusable variant option eligibility.
- `special_menu_groups` for menu group/category eligibility.
- `special_availability_windows` for recurring day/time availability.
- `order_discounts` for applied discount snapshots.
- `special_components` for future orderable deal component slots.
- `special_component_products` for exact products selectable inside each future deal component.
- `special_component_product_variant_options` for optional reusable variant option restrictions on those component products.
- `special_component_modifier_group_overrides` for optional component/product-specific included Modifier Group counts.
- `special_mix_match_rules` for the future Mix-and-Match fixed unit price rule.
- `special_mix_match_products` for exact products eligible in a future Mix-and-Match pool.
- `special_mix_match_product_variant_options` for optional reusable variant option restrictions on Mix-and-Match pool products.
- `special_mix_match_modifier_group_overrides` for optional pool product Modifier Group included-count overrides.

Allowed `special_type` values are `line_discount`, `fixed_price_line`, `cart_discount`, `orderable_deal`, and `mix_and_match_fixed_unit_price`. Allowed `discount_type` values are `percentage`, `fixed_amount`, and `fixed_price`.

Passive special eligibility and orderable deal component choices are intentionally separate:

- `special_products` and `special_menu_groups` define passive discount eligibility for normal cart lines.
- `special_component_products` defines which products a customer may choose for an orderable deal component.
- `special_component_product_variant_options` defines optional variant allow-lists for a chosen component product. If no rows exist for a component product, every enabled variant for that product is allowed.
- `special_component_modifier_group_overrides` defines optional included-selection overrides for a chosen component product and assigned Modifier Group. If no row exists, the product's normal included Modifier Group rule is used.
- Do not reuse passive eligibility rows as orderable deal component choices.

Mix-and-Match fixed unit price specials are schema/type-supported only. Runtime/admin/checkout/public behavior is not built yet.

- `special_mix_match_rules` stores one rule per `mix_and_match_fixed_unit_price` special: minimum quantity, optional maximum quantity, fixed unit price, and whether extra items beyond the minimum are allowed.
- `special_mix_match_products` stores exact products eligible for the mix pool. Category/subcategory eligibility is not built yet.
- `special_mix_match_product_variant_options` stores optional reusable variant allow-lists for a mix pool product. If no rows exist for a mix product, runtime should treat all enabled variants as allowed when Mix-and-Match runtime is built.
- `special_mix_match_modifier_group_overrides` stores optional included-selection overrides for a mix pool product and assigned Modifier Group. If no row exists, runtime should use the product's normal included Modifier Group rule when Mix-and-Match runtime is built.
- Hybrid deals such as "Any 2 for $7.99 each plus choose a 2-liter" should use the Mix-and-Match pool rule for the fixed-unit-price items and the existing orderable component model later for required attached side components.

For the first orderable deal MVP, `orderable_deal` uses `specials.discount_value` as the deal base/fixed price unless a later migration adds a clearer `deal_base_price` column. Runtime pricing is deal base price plus allowed child extras. DealBuilder filters child product variants when component restrictions exist, applies component/product modifier included-count overrides during child configuration, and checkout enforces the same variant restrictions and modifier included-count overrides server-side.

Special availability windows use `day_of_week` values `0` Sunday through `6` Saturday. All-day windows store null `start_time` and `end_time`; non-all-day windows require `start_time < end_time`. Overnight recurring windows are intentionally not supported in the MVP.

Passive specials apply after configured-product pricing. The shared configured-product pricing resolver remains responsible for product, variant, modifier, included-selection, placement, multiplier, and quantity pricing. Checkout integration, tenant-scoped Specials Admin UI, staff order discount display, public passive-special display, cart deal runtime, orderable deal checkout snapshots, and component variant restrictions exist. Coupon UI and BundleBuilder/ComboBuilder remain pending.

Future orderable deal expansions that are intentionally deferred:

- `special_component_menu_groups`
- `special_component_subcategories`
- exclusion tables
- optional component pricing tables
- allowed/excluded modifier option rules
- deal-specific default modifiers
- premium modifier pricing rules
