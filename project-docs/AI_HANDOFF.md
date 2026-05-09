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
