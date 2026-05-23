# Routes

_Last updated: 2026-05-23_

Status values:

- `current`: active route in the current product flow.
- `legacy/remove`: older route or compatibility route that should be removed or avoided.
- `future/planned`: planned route not implemented yet.
- `hidden/internal`: implemented route used by a workflow but not meant as a primary navigation destination.

## Public Pages

| Route | Status | Purpose |
| --- | --- | --- |
| `/` | current | Public entry page. |
| `/menu` | current | Customer-facing menu and product configuration entry point. |

## Checkout

| Route | Status | Purpose |
| --- | --- | --- |
| `/checkout` | current | Pickup checkout flow that creates unpaid demo orders. |

## Staff Orders

| Route | Status | Purpose |
| --- | --- | --- |
| `/staff/orders` | current | Staff order queue for new, accepted, preparing, ready, completed, and canceled status movement. |

## Admin Dashboard

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin` | current | Admin dashboard/navigation hub. Modifier management access lives under Product Management. |

## Product Management

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/products` | current | Product Management hub. |
| `/admin/products/categories` | current | Product category management. Category cards link to subcategory management for that category. |
| `/admin/products/subcategories` | current | Product subcategory management, usually entered with `categoryId` query context. |
| `/admin/products/list` | current | Product browser and product row actions. |
| `/admin/products/new` | current | Create product page. |
| `/admin/products/[productId]` | current | Edit product page. |
| `/admin/products/modifier-groups` | current | Product-to-Modifier Group assignment and per-product Modifier Option override flow. |
| `/admin/products/variant-assignments` | current | Product-to-variant-group assignment and per-product variant override flow. Usually entered with `productId` query context. |
| `/admin/products/variants` | legacy/remove | Removed from active navigation. Old product-specific variant route replaced by reusable Variant Groups and `/admin/products/variant-assignments`. Do not use for new work. |

## Reusable Variant Groups

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/products/variant-groups` | current | Reusable variant group management. |
| `/admin/products/variant-groups/[groupId]` | current | Variant options for one reusable variant group. With `productId`, this route is used for product-specific variant option overrides or preview. |

## Variant Assignments

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/products/variant-assignments?productId=...` | hidden/internal | Product-scoped entry from a Product card for assigning reusable variant groups and managing product-specific variant overrides. |

## Modifier Management

Modifier terminology:

- Modifier Category: admin organization layer backed by `modifier_categories`.
- Modifier Group: product-attached rule set backed by `modifier_groups`.
- Modifier Option Group: bucket/list inside a Modifier Group backed by `modifier_option_groups`.
- Modifier Option: selectable customer choice backed by `modifier_options`.

Products attach Modifier Groups. Products do not attach Modifier Categories or Modifier Option Groups directly. Products do not attach individual Modifier Options directly except through product-specific override/availability systems.

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/modifiers` | legacy/remove | Modifier management landing/compatibility route. Product Management is the current entry point. |
| `/admin/modifiers/groups` | current | Modifier Category list displayed as the current Modifier Groups entry point. |
| `/admin/modifiers/groups/[categoryId]` | current | Modifier Groups for one Modifier Category. |
| `/admin/modifiers/[groupId]` | current | Modifier Option Groups for one Modifier Group. With `productId`, this route is product-scoped and returns to product modifier assignments. |
| `/admin/modifiers/[groupId]/subgroups/[subgroupId]` | current | Modifier Options for one Modifier Option Group. With `productId`, this route is product-scoped for per-product Modifier Option overrides. |
| `/admin/modifiers/categories` | legacy/remove | Older direct Modifier Category management screen. The current flow starts at `/admin/modifiers/groups`. |
| `/admin/modifiers/subgroups` | legacy/remove | Older aggregate Modifier Group screen with filters. Use the current drill-down flow instead. |
| `/admin/modifiers/options` | legacy/remove | Older aggregate Modifier Option screen. Use the current drill-down flow instead. |

## Hidden/Internal Workflow Routes

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/products/subcategories?categoryId=...` | hidden/internal | Category-scoped subcategory management entry from a Product Category card. |
| `/admin/products/modifier-groups?productId=...` | hidden/internal | Product-scoped Modifier Group assignment entry from a Product card. |
| `/admin/products/variant-groups/[groupId]?productId=...` | hidden/internal | Product-scoped variant option override/preview route. |
| `/admin/modifiers/[groupId]?productId=...` | hidden/internal | Product-scoped Modifier Option Group list. |
| `/admin/modifiers/[groupId]/subgroups/[subgroupId]?productId=...` | hidden/internal | Product-scoped Modifier Option override list. |

## Future/Planned Admin Routes

| Route | Status | Purpose |
| --- | --- | --- |
| `/admin/settings` | future/planned | Business and admin settings. |
| `/admin/theme` | future/planned | Brand and theme management. |
| `/admin/pages` | future/planned | Page/content management. |
| `/admin/inventory` | future/planned | Inventory management. |
| `/admin/orders` | future/planned | Admin order management and history. |
