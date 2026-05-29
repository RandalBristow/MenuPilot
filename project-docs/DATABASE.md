# Database

_Last updated: 2026-05-29_

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

## Core Tenant Tables

- `profiles`
- `businesses`
- `business_users`
- `locations`
- `location_users`
- `location_hours`
- `location_hour_overrides`

The app is designed for multiple businesses and locations, but the current demo flows still use seeded Pronto Demo records.

## Menu And Product Tables

- `menus`
- `menu_groups`
- `products`
- `product_groups`
- `product_location_overrides`
- `media_assets`

`products` are the sellable items. `menu_groups` are customer/admin-facing product categories and subcategories. `product_groups` assigns products into menu groups.

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
- `charges`
- `order_charges`
- `payments`

Checkout currently validates/reprices cart contents server-side, then creates unpaid pickup orders with item and modifier snapshots. Stripe payment records/webhooks are planned but not implemented.

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

## Current Modeling Rule

Reusable configuration should follow this pattern:

1. Define reusable records globally.
2. Attach reusable records to products.
3. Store product-specific differences in override tables.
4. Clean up assignment-scoped overrides when assignments are removed.
5. Keep unassigned reusable objects view-only from product context.
