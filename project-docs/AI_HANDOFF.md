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
- Menu UI
- Homepage
- Pizza Builder UI
- Validation logic
- Loading state
- Pricing logic extracted
- Initial tests passing

### Current State
- Pizza builder functional but not fully feature-complete
- Pricing engine basic (no included toppings yet)
- No cart system yet
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

1. Add included toppings logic
2. Expand pricing engine
3. Build cart system
4. Build checkout
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
