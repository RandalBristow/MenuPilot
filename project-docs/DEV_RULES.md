# Development Rules

## Structure

- Use feature-first structure
- Do not put logic in `app/`
- Components must live in:
  - components/ui
  - components/themed
  - features/*/components

## UI Rules

- Do NOT use raw shadcn components directly in features
- Always wrap in themed components
- Mobile-first design required

## Code Rules

- TypeScript required
- No `any` unless unavoidable
- Keep functions small and focused
- Extract repeated logic

## Database Rules

- All changes must be migrations
- Do not modify schema manually in Supabase UI

## Reusable Configuration Rules

- Reusable configuration objects are managed globally.
- Products attach reusable objects.
- Product-specific changes are stored as overrides.
- Removing an assignment removes its overrides.
- Unassigned objects may be viewed but not overridden.

## Philosophy

- Clean > clever
- If built twice → extract
- Solve real problems first, polish later
