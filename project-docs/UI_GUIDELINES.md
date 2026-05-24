# MenuPilot UI Guidelines

## Mobile-First Philosophy

- Design mobile first, then enhance for tablet and desktop.
- Start with a single-column layout.
- Add columns only when the viewport has enough room for comfortable scanning.
- Avoid horizontal overflow at every supported width.
- Keep primary actions reachable and readable on small screens.
- Text must wrap cleanly and must not overlap controls.

## Supported Breakpoints

Preserve usability at:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px

Use these widths when checking dense admin pages, dialogs, sheets, product cards, and cart/configurator flows.

## Temporary Visual Direction

- Warm restaurant feel.
- Cream/light background.
- Dark text.
- Soft cream/white cards with warm gray borders.
- Warm tomato/red is reserved for destructive actions, errors, and unavailable warnings.
- Primary actions use a dark warm neutral only where strong contrast is needed.
- Accent states use warm non-red tints for selected controls, focused choices, and subtle emphasis.
- Green/success is reserved for enabled, available, completed, or successful states.

Do not change colors randomly. Color changes should be intentional, requested, and applied consistently.

## Default Color Semantics

- Primary action: dark warm neutral background with light text, used for important commits such as add, save, checkout, and confirm.
- Accent: warm neutral/amber tint for selected options, active filters, and low-risk emphasis. Do not use accent as an error or success color.
- Success/available: green token only for enabled, available, successful, or completed state indicators.
- Destructive/error: tomato/red token only for remove, delete, unavailable, destructive, or validation/error states.
- Backgrounds/cards/borders: warm cream page background, soft cream or white cards, and warm gray borders. Avoid pure black/white surfaces unless contrast requires it.

## Compact Admin Layout

- Admin pages should be dense, scannable, and task-focused.
- Prefer category filters, tabs, segmented controls, or pills over long stacked pages.
- Do not show every category at once when filtering makes the page easier to scan.
- Keep list pages focused on browsing and management actions.
- Do not permanently embed create/edit forms in list pages.
- Avoid oversized cards and large empty vertical gaps.

## Mobile Admin Data Layout

- Mobile admin pages should avoid large stacked cards when displaying many records.
- Use category/filter pills at the top when filtering large lists.
- Use section headers for subcategories.
- When selected category/filter pills already identify the current context, do not repeat the selected category title and description below the pills unless extra context is needed.
- Use compact list rows for individual records.
- Tapping a row may open a sheet, dialog, or detail page for actions and details.
- Avoid putting every record into a large accordion.
- Accordions are acceptable for nested detail sections, not primary lists.
- Hide visible scrollbars on mobile while preserving scroll behavior.
- Test mobile admin data layouts at 320px, 375px, 390px, and 430px.

## Mobile Admin Fixed Action Layouts

- Dense mobile admin list pages may use a viewport-height flex layout.
- Keep page headers, filter pills, and primary context controls in a `shrink-0` header area.
- Put record cards in a `min-h-0 flex-1 overflow-y-auto no-scrollbar` body so only records scroll.
- Use a fixed bottom action footer for primary add/create actions on dense mobile admin lists.
- Fixed bottom add footers should be right-aligned, use icon buttons with aria-labels, and respect `env(safe-area-inset-bottom)`.
- Add enough bottom padding to the scrollable list so the final record is not hidden behind the fixed footer.
- Do not use `sticky bottom-0` when the action must remain pinned to the viewport at the end of the list.
- Apply this pattern only when it improves mobile scan density and repeated list management.

## Mobile Compact Record Rows

- Compact record rows are the standard mobile layout for dense admin records such as products, categories, Modifier Groups, Modifier Option Groups, Modifier Options, menus, locations, pages, settings records, and similar management items.
- In modifier admin/product UI, use the current terminology consistently:
  - Modifier Category for the admin organization layer.
  - Modifier Group for the product-attached rule set.
  - Modifier Option Group for buckets/lists inside a Modifier Group.
  - Modifier Option for the selectable customer choice.
- The first row must contain only:
  - a passive status icon when the record has enabled/disabled state
  - the record name/title
- Do not place badges, chips, prices, counts, actions, menus, metadata, or buttons to the right of the record name.
- Long names must stay on one line on mobile and truncate with ellipsis.
- The status icon must be fixed-width and must not shrink.
- The name/title container must support flex truncation, including `min-width: 0`.
- Description, helper text, category, type, template, counts, and other metadata must appear below the name row.
- Metadata chips may appear below the description only if they do not make the row bulky.
- Actions must appear in a separate action row below the description/metadata.
- The left side of the action row is reserved for the primary state toggle, such as enable/disable.
- The right side of the action row is reserved for view, edit, navigation, or secondary actions.
- The passive status icon communicates current state only.
- The toggle button changes the state and should cause the passive status icon to update.
- Repeated row actions should use compact icon buttons when the meaning is clear.
- Every icon button must have a specific aria-label.
- Destructive actions should not be prominent row actions. If destructive actions are needed, they should be secondary/subtle and protected by confirmation.

## Admin Record Row Actions

- Enable/Disable is a left-aligned icon button.
- View and Edit are right-aligned icon buttons on the same action row.
- Do not use text buttons such as "Edit Group" inside compact record rows.
- Use icons only with aria-labels:
  - enabled = thumbs up
  - disabled = thumbs down
  - view = eye
  - edit = pencil
- Status may appear as a small passive badge/icon near the record name.
- Action row layout should be consistent across products, modifiers, Modifier Groups, Modifier Option Groups, variants, and other admin records.

## Sticky Headers

- Use sticky headers when the page has navigation, category filters, cart actions, or repeated workflow controls.
- Sticky headers should be compact on mobile.
- Header content should not consume too much vertical space.
- Keep sticky layers readable against the page background.
- Avoid stacking multiple sticky bars unless the workflow needs it.

## Card Spacing And Density

- Use cards for repeated items, grouped panels, modals/sheets, and meaningful containers.
- Avoid cards inside cards.
- Admin cards should be compact.
- Suggested padding:
  - Mobile: `p-3` or `p-4`
  - Desktop: `p-4` or `p-5`
- Mobile compact record cards should use tighter inner spacing than general cards, such as `px-2.5 py-2`, and should remove default card padding when the row component supplies its own padding.
- Modifier/admin record rows should prioritize scan density on mobile; avoid generous card padding, oversized empty interiors, and large gaps around row actions.
- Keep card headers concise.
- Prefer one-line summaries over large detail blocks.
- Keep action rows tight and close to the item they affect.

## Public Product Cards

- Product cards in the same menu section should use a consistent structure: media area, product name, description, and price/action row.
- When product cards support media, every card in that section should reserve the same image area.
- Products without images should show a warm themed placeholder area, not a collapsed or oversized blank space.
- Product images should use a stable aspect ratio and `object-fit: cover`.
- Image alt text should come from media `alt_text` when available, then fall back to the product name.
- Placeholder media areas are decorative and should not announce misleading image text.
- Featured badges must be intentional. Do not show Featured by default or from unverified placeholder data.

## Typography Hierarchy

- Page title: largest heading on the page.
- Page description: short, muted, optional.
- Section title: smaller than page title and close to its content.
- Card title: compact and scannable.
- Metadata, helper text, and counts: small and muted.
- Avoid hero-scale text inside admin cards, sidebars, tables, and compact panels.

## Dialogs And Sheets

- Use dialogs/sheets for create and edit flows on list pages.
- Use sheets for mobile-friendly admin forms with multiple fields.
- Inline forms are acceptable only for very small, isolated controls.
- After successful create/edit actions, close the dialog/sheet and refresh or update the list.
- Do not leave create/edit forms permanently embedded in list pages.

## Mobile Admin Add/Edit/View Forms

- Must use full available width on mobile.
- Must use full available height on mobile.
- Must have a fixed/sticky header if needed.
- Must have a scrollable body.
- Must have a sticky footer at the bottom.
- Footer action buttons should stay visible.
- Footer action buttons should be in one horizontal row when possible.
- Footer action buttons must be right-aligned.
- View-only form footers should contain only a right-aligned close icon button.
- Footer buttons should use icon buttons with accessible aria-labels.
- Do not use short floating dialog panels for admin forms on mobile.
- Avoid visible mobile scrollbars, but scrolling must still work.

## Form Layout

- Group fields by task.
- Use single-column forms on mobile.
- Use two-column form grids only where labels and inputs still fit cleanly.
- Use selects for fixed option sets.
- Use checkboxes/toggles/selects for enabled/disabled or true/false controls.
- Required fields should be obvious.
- Keep create/edit components reusable when edit mode is planned.
- Avoid adding unrelated fields before they are needed.

## Button Placement

- Put primary create/add actions near the page or selected section header.
- Put item actions inside the relevant card or row.
- Keep Edit and Enable/Disable easy to find.
- Destructive actions should be secondary/subtle, not visually dominant.
- Use confirmation for destructive actions.
- Prefer compact icon buttons for repeated secondary actions when the meaning is clear.
- Buttons must fit at 320px without text clipping.

## Codex-Specific UI Rules

- Do not create oversized cards.
- Avoid large empty vertical gaps.
- Preserve mobile usability at all supported breakpoints.
- Avoid redesigning pages unless explicitly asked.
- Reuse existing layout patterns.
- Do not change colors randomly.
- Do not add permanently embedded forms to list pages.
- Prefer small, focused UI improvements over broad visual rewrites.
- Preserve current workflows unless the task explicitly changes them.

## Scrolling Rules

- Scrolling is allowed and required for content overflow.
- Visible scrollbars should be hidden on mobile.
- Use `overflow-auto` or `overflow-y-auto` for content.
- Hide scrollbars using utility classes (no-scrollbar).
- Horizontal scrolling (like category pills) must not show scrollbars.
- Do not disable scrolling entirely.
