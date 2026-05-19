# Codex Instructions

## General Behavior

- Follow DEV_RULES.md at all times
- Do not change architecture unless explicitly asked
- Do not move files outside defined structure

## Implementation Rules

- Use existing patterns in the project
- Keep changes minimal and focused
- Do not refactor unrelated code
- Preserve reusable configuration boundaries:
  - reusable objects are edited globally
  - products attach reusable objects
  - product-specific changes are overrides
  - removing assignments removes overrides
  - unassigned objects are view-only in product context
- Preserve modifier hierarchy terminology:
  - `modifier_group_categories` are top-level Modifier Groups
  - `modifier_groups` are Modifier Group Subgroups
  - `modifier_option_groups` are Option Groups
  - `modifier_options` are selectable choices

## UI Rules

- Use themed components only
- Maintain consistency with existing UI

## Database

- Never create tables manually
- Always use migration files

## When Unsure

- Prefer consistency over creativity
- Do not invent new patterns
