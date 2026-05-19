# MenuPilot AI Handoff

_Last updated: 2026-05-19_

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
- `/checkout` pickup checkout that writes unpaid orders to Supabase.
- `/staff/orders` staff queue with order status updates.
- `/admin` admin hub.
- `/admin/products` product management hub and product/category/subcategory/product form flows.
- Reusable variant group list, option editing, product assignment, and per-product overrides.
- Modifier library flow using the updated hierarchy.
- Product modifier group assignment with per-product modifier option overrides.
- Variant-specific modifier option availability filtering.

Current gaps:
- Admin/staff auth is not enforced yet.
- Checkout creates orders but still needs full server-side price validation and a transaction/RPC pattern.
- Stripe payment, webhooks, refunds, and payment status automation are not implemented.
- Public menu and checkout still use seeded demo business/location records.
- Website builder, theme editor, inventory, reporting, delivery, and display panels remain future work.

## Modifier Hierarchy

The current modifier terminology is important:

- `modifier_group_categories` are top-level Modifier Groups in the admin UI.
- `modifier_groups` are Modifier Group Subgroups.
- `modifier_option_groups` are option groups inside a modifier subgroup.
- `modifier_options` are the selectable choices shown to customers.
- `product_modifier_groups` attaches a reusable modifier subgroup to a product.
- `product_modifier_option_overrides` stores product-specific option price, prep time, enabled, and sort overrides.

Modifiers should behave like variants:

- Define reusable objects globally.
- Attach reusable objects to products.
- Store product-specific differences as overrides.
- Remove assignment-specific overrides when the assignment is removed.
- Keep unassigned reusable objects view-only in product context.

## Key Architecture Rules

- Feature-first folder structure is required.
- Routes in `app/` must stay thin.
- Business logic belongs in `features/`, `lib/`, or database migrations.
- Use existing themed components and project UI patterns.
- All database changes must be migrations.
- Mobile-first UI is required.
- TypeScript is required; avoid `any` unless unavoidable.
- If a pattern is built twice, extract it.

## Current Goal

The active focus is stabilizing the mobile-first admin product/modifier flow:

1. Keep Product Management focused on categories, subcategories, products, variant groups, and modifier groups.
2. Keep modifier library management under the product flow instead of a separate admin dashboard card.
3. Match the variant group flow for modifier group definition, assignment, and per-product overrides.
4. Preserve public ordering correctness while admin data structures evolve.

## Suggested Next Steps

1. Verify the modifier group/subgroup/options admin pages on 320px, 375px, 390px, 430px, tablet, and desktop.
2. Add or tighten tests for modifier overrides and variant-based modifier availability.
3. Add server-side checkout price validation before Stripe.
4. Move order creation to a transaction/RPC-style pattern.
5. Add auth/role protection for admin and staff routes.
