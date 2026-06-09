# Product Entry Regression Matrix

_Last updated: 2026-06-07_

This matrix records the current product-entry audit after Builder Mode Foundation. Code coverage confirms builder routing, pricing, cart shape, checkout validation/repricing, and order/staff snapshot helpers. Full admin-to-staff browser verification is still required before starting Specials Engine.

For the full new-business flow before a clean database rebuild, run `TENANT_ONBOARDING_REGRESSION.md` in addition to this product-entry matrix.

## Shared Flow

All normal product types use this path:

1. Admin setup through Product Management, reusable Variant Groups, Modifier Groups, Modifier Option Groups, Modifier Options, and product-scoped assignments/overrides.
2. Public menu display from `/menu`.
3. ProductConfigurator resolves the builder mode.
4. Builder writes a `CartItem` with product, variant, quantity, modifier, and price snapshots.
5. Checkout reloads server-authoritative product config in the resolved business context and runs `validateAndPriceCart`.
6. Checkout creates `orders`, `order_items`, and `order_item_modifiers` snapshots.
7. Staff orders read order snapshots for `/staff/orders` or `/businesses/[businessSlug]/locations/[locationSlug]/orders`.

Pricing remains centralized through `priceConfiguredProduct` in active builders and checkout validation. Legacy `/checkout` and `/staff/orders` remain Pronto Demo/main-street; scoped `/businesses/[businessSlug]/checkout` validates business/location orderability and rejects cross-tenant carts, and scoped staff orders filter by selected business/location. Platform Admin activation controls manage the business/location status and ordering flags that checkout uses. Staff order display now reads Specials discount snapshots and shows subtotal/discount/total only when discounts exist. Orderable Specials deals can checkout through parent/child order item snapshots; passive specials do not apply to deal items in MVP. Deal component modifier included-count overrides apply only to the child product inside that deal component and do not change normal product setup.

Product Modifier Assignments warn when default selected modifier options exceed included selections for the assigned Modifier Group. The warning is informational only; defaults still consume included selections and pricing remains centralized in `priceConfiguredProduct`.

Mix & Match specials can be built from the public menu, added to cart as one nested parent item with child selections, checked out through server-authoritative validation, persisted as nested parent/child order item snapshots, and displayed in staff orders.

Pizza half-topping behavior is business-level configuration. Default behavior is
left/right placement price weight `0.5`, whole placement weight `1.0`, and
left/right included-slot weight `0.5`, with floor-to-cent rounding after
placement weight and multiplier are applied.

## Matrix

| Product type | Supported | Builder mode | Manual setup needed | Test coverage | Known issues |
| --- | --- | --- | --- | --- | --- |
| Pizza | Partial until manual full-flow pass | PizzaBuilder | Product with pizza template, size Variant Group, crust/sauce/topping Modifier Groups, defaults, included topping rules, variant price overrides as needed | PizzaBuilder selected-row/default behavior; resolver routes pizza; pricing resolver and checkout configurable-product tests | Needs manual admin -> menu -> cart -> checkout -> staff verification |
| Chicken Salad | Partial until manual full-flow pass | GenericConfigurableBuilder | Salad product with variants if needed, Salad Toppings Modifier Group, Modifier Option Groups, defaults, included rules, dressing Modifier Group if desired | GenericConfigurableBuilder defaults, required validation, included selections, variant availability/pricing, grouped options; checkout configurable-product tests | Needs manual full-flow verification with real Chicken Salad data |
| Drink with variants only | Partial until manual full-flow pass | SimpleProductBuilder variant mode | Product with drink/standard template, assigned Variant Group, no Modifier Groups | SimpleProductBuilder variant-only cart item shape; resolver simple-variant; checkout simple variant-only repricing | Needs manual full-flow verification |
| Simple item | Partial until manual full-flow pass | SimpleProductBuilder quantity-only mode | Product with base price, no variants, no Modifier Groups | SimpleProductBuilder quantity-only UI; resolver simple-quantity; checkout simple quantity-only repricing; order payload without variant | Needs manual full-flow verification |
| Extra sauce | Partial until manual full-flow pass | SimpleProductBuilder quantity-only mode unless intentionally configurable | Product with base price, no variants/modifiers, or configurable sauce Modifier Group if needed | Checkout simple quantity-only repricing covers extra sauce shape | Needs manual full-flow verification using actual extra sauce product |
| Sub with modifiers | Partial until manual full-flow pass | GenericConfigurableBuilder | Sub product with Modifier Groups for bread, cheese, toppings, extras, required/min/max rules, defaults if needed | GenericConfigurableBuilder required validation and generic modifier behavior; checkout modifier validation | Needs manual full-flow verification with real sub data |
| Wings with count and sauce modifiers | Partial until manual full-flow pass | GenericConfigurableBuilder | Wings product with count Variant Group, sauce Modifier Group, required/min/max rules, defaults if needed | GenericConfigurableBuilder variants plus modifiers; checkout variant and modifier validation | Needs manual full-flow verification with real wings data |
| Combo/bundle | Supported as safe future fallback only | Unsupported future message | Do not configure as orderable for MVP | ProductConfigurator combo unsupported test | BundleBuilder/ComboBuilder intentionally not implemented |

## Route And Component Map

- Admin setup: `/admin/products`, `/admin/products/list`, `/admin/products/new`, `/admin/products/[productId]`, `/admin/products/variant-groups`, `/admin/products/variant-assignments`, `/admin/products/modifier-groups`, `/admin/modifiers/...`.
- Public menu: `features/menu/queries/get-menu.ts`, `features/menu/components/MenuClient.tsx`, `features/menu/components/ProductCard.tsx`.
- Builder routing: `features/product-configurator/components/ProductConfigurator.tsx`, `features/product-configurator/utils/resolve-product-builder-mode.ts`.
- Active builders: PizzaBuilder, GenericConfigurableBuilder, SimpleProductBuilder.
- Cart: `features/cart/context/CartProvider.tsx`, `features/cart/types/cart.ts`.
- Checkout validation/pricing: `features/checkout/utils/validate-and-price-cart.ts`.
- Order snapshots: `features/checkout/utils/build-order-payload.ts`, `features/checkout/actions/create-order.ts`.
- Staff display: `features/staff-orders/queries/get-orders.ts`, `features/staff-orders/actions/update-order-status.ts`, `features/staff-orders/components/StaffOrdersPage.tsx`.

## Manual Verification Checklist

- [ ] Pizza: build, cart, checkout, staff order.
- [ ] Pizza half toppings: left/right 1x charges half price, left/right 2x charges one full topping price, and half toppings consume 0.5 included slots when enabled.
- [ ] Chicken Salad: build, cart, checkout, staff order.
- [ ] Drink with variants: add, cart, checkout, staff order.
- [ ] Simple item: add, cart, checkout, staff order.
- [ ] Extra sauce: add, cart, checkout, staff order.
- [ ] Sub with modifiers: build, cart, checkout, staff order.
- [ ] Wings with count/sauce: build, cart, checkout, staff order.
- [ ] Combo/future product: opens unsupported message and does not allow add to cart.
- [ ] Platform activation: setup/paused business or location blocks scoped checkout; active business plus active/enabled/accepting/pickup location allows scoped checkout with a valid cart.
- [ ] Default modifier warning: 5 default toppings with 0 included selections shows a warning; setting included selections to 5 removes it.
- [ ] Public specials display: active specials appear in Current Specials, eligible line/fixed-price products show a badge, and disabled/expired/future/inactive-now specials stay hidden.
- [ ] Specials staff display: no-discount order stays compact; discounted order shows subtotal, discount total, final total, and applied special name.
- [ ] Orderable deal checkout: build active deal, checkout successfully, confirm parent/child staff display, and confirm passive discounts do not discount the deal item.
- [ ] Orderable deal modifier override: configure a deal child with a component included-count override, confirm DealBuilder pricing and checkout server repricing match, and confirm the same product outside the deal keeps its normal included count.
- [ ] Mix & Match cart-add: build an active Mix & Match deal, add default and customized pool products, confirm variant restrictions and Modifier Group included-count overrides are honored in ProductConfigurator, and confirm one nested parent Mix cart item is created.
- [ ] Mix & Match checkout/order/staff: confirm checkout accepts a valid Mix cart item, rejects stale Mix totals, writes one parent row plus child rows, excludes passive discounts from Mix rows, and shows the nested Mix order in staff orders.

## Specials Readiness

Product entry is not ready to move to Specials Engine until the manual verification checklist above passes. No code blocker was found in the audit, but browser verification with real configured products is still required.

Clean database rebuild should also wait until `TENANT_ONBOARDING_REGRESSION.md` passes or any exceptions are documented.
