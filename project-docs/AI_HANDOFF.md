# MenuPilot AI Handoff

_Last updated: 2026-05-29_

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
- Product configurator with reusable variant groups, modifier groups, included credits, multiplier-aware pricing, and cart integration.
- Cart provider, summary bar, sheet UI, and localStorage persistence.
- `/checkout` pickup checkout that validates/reprices cart contents server-side and writes unpaid orders to Supabase.
- `/staff/orders` staff queue with order status updates.
- `/admin` admin hub.
- `/admin/media` Media Library for image upload/import metadata backed by `media_assets`.
- `/admin/products` product management hub and product/category/subcategory/product form flows.
- Products select images from Media Library through `products.image_media_id`.
- Reusable variant group list, option editing, product assignment, and per-product overrides.
- Modifier library flow using the updated hierarchy.
- Product modifier group assignment with per-product modifier option overrides.
- Modifier option setup cleanup supports safe hard delete for unused options and moving options between Modifier Option Groups inside the same Modifier Group.
- Variant-specific modifier option availability filtering.
- Variant-specific modifier option price overrides on the product Modifier Group variant rules page.
- Builder template routing is explicit: `pizza` uses PizzaBuilder; `standard`, `wings`, `sub`, `salad`, and `drink` use StandardItemBuilder.

Current gaps:
- Admin/staff auth is not enforced yet.
- Checkout creates orders after server-side price validation but still needs a transaction/RPC pattern.
- Stripe payment, webhooks, refunds, and payment status automation are not implemented.
- Public menu and checkout still use seeded demo business/location records.
- Website builder, theme editor, inventory, reporting, delivery, and display panels remain future work.

Recently completed:
- Variant-specific modifier option price overrides are done. Do not treat "add variant-specific modifier option price overrides" as the next task; future work should verify, refine, or extend the existing implementation.
- Builder template support is formalized for admin-created non-combo templates. Current custom builders are PizzaBuilder and StandardItemBuilder; Combo/BundleBuilder remains future work before true bundle specials or meal deals.

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

## Current Goal

The active focus is stabilizing the mobile-first admin product/modifier flow:

1. Keep Product Management focused on categories, subcategories, products, variant groups, and modifier groups.
2. Keep modifier library management under the product flow instead of a separate admin dashboard card.
3. Match the variant group flow for Modifier Group definition, assignment, and per-product overrides.
4. Preserve public ordering correctness while admin data structures evolve.

## Suggested Next Steps

1. Verify Modifier Category, Modifier Group, Modifier Option Group, and Modifier Option admin pages on 320px, 375px, 390px, 430px, tablet, and desktop.
2. Add or tighten tests as modifier override and variant-rule behavior expands.
3. Move order creation to a transaction/RPC-style pattern.
4. Add auth/role protection for admin and staff routes.
5. Continue mobile checks for Media Library and product Modifier Group variant rules.
