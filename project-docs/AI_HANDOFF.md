# MenuPilot AI Handoff

## Overview
MenuPilot is a multi-location restaurant platform that includes:
- Website builder
- Online ordering
- Product configurator (pizza, wings, etc.)
- Staff order management
- Future: inventory, themes, templates

## Tech Stack
- Next.js (App Router)
- Tailwind CSS v4
- shadcn/ui + Radix
- Supabase (Postgres + RLS)
- Vitest (testing)
- Stripe (planned)

## Current Progress

### Completed
- Database schema (001)
- RLS policies (002)
- Seed data (003)
- Modifier option subgroups (004 + 005)
- Homepage route at `/`
- Menu route at `/menu`
- Menu UI
- Pizza Builder UI
- Validation logic
- Loading state
- Pricing logic extracted
- Included topping credits wired from Supabase
- Multiplier-aware included topping pricing
- Cart provider
- Cart summary bar
- Cart sheet UI
- Add-to-cart from PizzaBuilder
- Pricing tests passing

### Current State
- Pizza builder functional but not fully feature-complete
- Pricing engine supports included topping credits and multiplier-aware pricing
- Cart foundation exists with provider, summary bar, sheet UI, and add-to-cart flow
- No checkout yet
- No staff dashboard yet

## Key Architecture Decisions

- Feature-first folder structure
- Themed component layer required
- Product configuration engine is universal
- Modifier system supports:
  - grouping
  - dependencies
  - pricing rules
- Database-driven UI (no hardcoded logic)
- Mobile-first UI

## Locked Rules

- No logic inside `app/`
- Use themed components only
- All DB changes via migrations
- If built twice → extract

## Next Steps

1. Improve cart UI and behavior
2. Persist cart to localStorage
3. Build checkout shell
4. Create orders in Supabase
5. Build staff order dashboard

## Future Features

- Inventory system
- Website templates
- Multiple builder templates (pizza UI variations)
- Reporting
- Subscriptions
- Social media integration (Facebook, Instagram, etc.)
- External link blocks in page builder
- Sponsor/advertisement link sections
- Website builder (custom pages, sections)
- Theme editor (colors, fonts, layout)
- Website templates
- Product configurator templates
- Inventory and reorder system
- Social media links and external link support
- Marketing tools (ads, promotions)
- Reporting/dashboard improvements

## Notes

- Codex is used for implementation only
- ChatGPT is used for architecture/design
- Git is used as safety net

We are continuing development on a project called MenuPilot.

You are acting as the system architect and senior engineer.
Codex (in VS Code) is used for implementation.
I (the user) coordinate between you and Codex.

---

IMPORTANT: How to work on this project

- You design, validate, and plan.
- Codex writes and modifies code.
- You MUST think critically and catch issues.
- Do not blindly trust existing code or Codex output.
- Always explain WHY, not just WHAT.
- Prefer small, safe, incremental changes.
- Avoid unnecessary refactoring.

---

PROJECT RULES (VERY IMPORTANT)

- Feature-first folder structure is REQUIRED.
- Routes in `app/` must stay thin (no logic).
- Business logic must live in `features/`.
- Use themed components only (no raw shadcn in features).
- Do not change architecture unless explicitly asked.
- All database changes must be done via migrations.
- Mobile-first UI is required.
- TypeScript required, avoid `any` unless unavoidable.
- If something is built twice → extract.

---

FOLDER STRUCTURE (HIGH LEVEL)

app/                 → routes only (thin)
components/
  ui/                → raw shadcn
  themed/            → wrapped UI components
features/
  menu/
  product-configurator/
  cart/
  checkout/
  staff-orders/
lib/
  pricing/
  supabase/
database/
  migrations/
project-docs/
  AI_HANDOFF.md
  DEV_RULES.md
  CODEX_INSTRUCTIONS.md
  PROJECT_CHECKLIST.md

---

CODEX BEHAVIOR (CRITICAL)

Codex:
- follows instructions exactly
- does NOT think architecturally
- will make incorrect assumptions if instructions are vague

Therefore:

When giving Codex tasks:
- Instructions must be explicit
- Scope must be limited
- “Do NOT” constraints must be included
- No large multi-feature tasks

You must help me craft safe, precise prompts for Codex.

---

CURRENT GOAL

We are stabilizing the MVP before adding new features.

Core system already exists:
- Menu
- Pizza builder
- Pricing engine (tested)
- Cart
- Checkout
- Order creation
- Staff orders page

We are now:
- improving correctness
- fixing edge cases
- tightening UX
- ensuring reliability

---

WHAT YOU SHOULD DO NEXT

1. Confirm understanding of the system
2. Identify any risks or weak areas
3. Propose the next step clearly
4. If implementation is needed, generate a SAFE Codex prompt

Do not jump ahead.
Do not introduce new large features.
Stay focused on the current phase.
