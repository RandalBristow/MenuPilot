# Routes

_Last updated: 2026-05-19_

## Public And Ordering Routes

| Route | Purpose |
| --- | --- |
| `/` | Public entry page. |
| `/menu` | Customer-facing menu and product configuration entry point. |
| `/checkout` | Pickup checkout flow that creates unpaid demo orders. |

## Staff Routes

| Route | Purpose |
| --- | --- |
| `/staff/orders` | Staff order queue for new, accepted, preparing, ready, completed, and canceled status movement. |

## Admin Routes

| Route | Purpose |
| --- | --- |
| `/admin` | Admin dashboard/navigation hub. Modifier access has moved under Products. |
| `/admin/products` | Product Management hub. |
| `/admin/products/list` | Product browser and product row actions. |
| `/admin/products/new` | Create product page. |
| `/admin/products/[productId]` | Edit product page. |
| `/admin/products/categories` | Product category management. |
| `/admin/products/subcategories` | Product subcategory management. |
| `/admin/products/variant-groups` | Reusable variant group list. |
| `/admin/products/variant-groups/[groupId]` | Variant options for one reusable variant group. |
| `/admin/products/variant-assignments` | Product-to-variant-group assignment and per-product variant override flow. |
| `/admin/products/modifier-groups` | Product-to-modifier-group assignment and per-product modifier override flow. |

## Admin Modifier Library Routes

| Route | Purpose |
| --- | --- |
| `/admin/modifiers` | Modifier management landing/compatibility route. |
| `/admin/modifiers/categories` | Modifier group category management. |
| `/admin/modifiers/groups` | Top-level Modifier Groups list backed by `modifier_group_categories`. |
| `/admin/modifiers/groups/[categoryId]` | Modifier Group Subgroups list backed by `modifier_groups` for one parent group/category. |
| `/admin/modifiers/[groupId]` | Option Groups list backed by `modifier_option_groups` for one modifier subgroup. |
| `/admin/modifiers/[groupId]/subgroups/[subgroupId]` | Modifier options backed by `modifier_options` for one option group. |
| `/admin/modifiers/subgroups` | Legacy/global subgroup management screen with chip filters. |
| `/admin/modifiers/options` | Legacy/global modifier option management screen. |

## Planned Admin Routes

| Route | Purpose |
| --- | --- |
| `/admin/settings` | Business and admin settings. |
| `/admin/theme` | Brand and theme management. |
| `/admin/pages` | Page/content management. |
| `/admin/inventory` | Inventory management. |
| `/admin/orders` | Admin order management and history. |
