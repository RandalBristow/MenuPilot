# Development Rules

## Structure

- Use feature-first structure.
- Do not put logic in `app/`.
- Components must live in:
  - `components/ui`
  - `components/themed`
  - `features/*/components`

## UI Rules

- Do not use raw shadcn components directly in features.
- Always wrap in themed components.
- Mobile-first design is required.

## Code Rules

- TypeScript required.
- No `any` unless unavoidable.
- Keep functions small and focused.
- Extract repeated logic.

## Database Rules

- All changes must be migrations.
- Do not modify schema manually in Supabase UI.

## Reusable Configuration Rules

- Reusable configuration objects are managed globally.
- Products attach reusable objects.
- Product-specific changes are stored as overrides.
- Removing an assignment removes its overrides.
- Unassigned objects may be viewed but not overridden.
- Variants and modifiers should follow the same reusable-definition, product-assignment, product-override pattern.
- Modifier hierarchy is:
  - `modifier_group_categories` = top-level Modifier Groups
  - `modifier_groups` = Modifier Group Subgroups
  - `modifier_option_groups` = Option Groups
  - `modifier_options` = selectable choices

## Philosophy

- Clean > clever.
- If built twice, extract.
- Solve real problems first, polish later.
