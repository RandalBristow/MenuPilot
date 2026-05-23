# MenuPilot

MenuPilot is a mobile-first restaurant menu, ordering, and admin platform. The current project is a working MVP/demo for Pronto Demo Pizza & Carryout with public ordering, configurable products, cart/checkout, staff order handling, and admin menu management.

## Current Status

Implemented:
- Public entry route at `/` and customer menu at `/menu`.
- Product configurator with reusable variants, modifiers, included topping credits, multiplier pricing, and cart integration.
- Cart persistence through local storage.
- Pickup checkout that creates unpaid orders in Supabase.
- Staff order queue at `/staff/orders` with status updates.
- Admin product management for categories, subcategories, products, reusable variant groups, product variant assignments, and modifier group assignments.
- Admin modifier library flow using the current hierarchy:
  - `modifier_categories` = Modifier Categories for admin organization
  - `modifier_groups` = modifier subgroups
  - `modifier_option_groups` = option groups inside a subgroup
  - `modifier_options` = selectable options
- Per-product variant option overrides and per-product modifier option overrides.
- Variant-specific modifier option availability filtering.

Still planned or incomplete:
- Auth-protected admin/staff access.
- Stripe payment flow and webhooks.
- Server-side checkout price recalculation/validation.
- Transactional order creation RPC/pattern.
- Website builder, theme editor, inventory, reporting, delivery, and display panels.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui and Radix primitives
- Supabase/Postgres
- Vitest
- Stripe planned

## Project Structure

- `app/` contains thin route files only.
- `features/` contains feature UI, queries, actions, and business logic.
- `components/ui/` contains raw shadcn components.
- `components/themed/` contains reusable themed wrappers.
- `lib/` contains shared infrastructure and utilities.
- `database/migrations/` contains all database schema changes.
- `project-docs/` contains project memory and implementation rules.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npx tsc --noEmit
npm test
```

## Environment

The app expects Supabase environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The current public menu, checkout, and staff flows are still demo-oriented and use seeded Pronto Demo records rather than tenant selection/auth.
