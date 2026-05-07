# MenuPilot Completion Checklist

_Last updated: 2026-05-06_

This file is the step-by-step project itinerary. The project is considered complete when every required checklist item is complete or intentionally deferred with a documented reason.

Legend:

- [ ] Not started
- [x] Complete
- [~] In progress
- [!] Blocked
- [D] Deferred

---

# 0. Project Setup

## 0.1 Local development tools

- [x] Install VS Code
- [x] Install Node.js LTS
- [x] Install Git for Windows
- [x] Install GitHub Desktop optional
- [ ] Install Supabase CLI
- [x] Confirm `node --version`
- [x] Confirm `npm --version`
- [x] Confirm `git --version`
- [ ] Confirm Supabase CLI works
- [x] Create GitHub account or confirm existing account
- [x] Sign into GitHub from VS Code
- [x] Choose local project folder location
- [x] Create project root folder
- [x] Initialize Git repository
- [ ] Create remote GitHub repository
- [ ] Connect local repo to GitHub remote
- [ ] Make first commit

## 0.2 Create Next.js app

- [x] Create Next.js app with TypeScript
- [x] Enable App Router
- [x] Install Tailwind CSS
- [ ] Install shadcn/ui
- [x] Configure path alias `@/*`
- [x] Confirm app runs locally
- [x] Clean default starter files
- [ ] Add base README
- [x] Add `.env.local.example`
- [ ] Add `.gitignore` review
- [x] Add formatter/linting configuration
- [x] Add Prettier
- [x] Add ESLint rules
- [x] Add initial project documentation folder

## 0.3 Required documentation files

- [x] Create `PROJECT_STATE.md`
- [x] Create `PROJECT_CHECKLIST.md`
- [ ] Create `ARCHITECTURE.md`
- [ ] Create `DATABASE.md`
- [ ] Create `DEPLOYMENT.md`
- [ ] Create `CONTRIBUTING.md`
- [ ] Create `CHANGELOG.md`

---

# 1. Professional Folder Structure

## 1.1 Root folders

- [x] Create `app/`
- [x] Create `components/`
- [x] Create `features/`
- [x] Create `lib/`
- [x] Create `database/`
- [x] Create `hooks/`
- [x] Create `types/`
- [x] Create `styles/`
- [x] Create `project-docs/`
- [x] Create `public/`

## 1.2 App route groups

- [ ] Create `app/(public)/`
- [ ] Create `app/(admin)/`
- [ ] Create `app/(staff)/`
- [ ] Create `app/api/`
- [ ] Add root layout
- [ ] Add public layout
- [ ] Add admin layout
- [ ] Add staff layout
- [ ] Add loading screens where appropriate
- [ ] Add error boundaries where appropriate
- [ ] Add not-found pages where appropriate

## 1.3 Component structure

- [x] Create `components/ui/` for shadcn components only
- [x] Create `components/themed/`
- [x] Create `components/layout/`
- [x] Create `components/shared/`
- [ ] Add component README explaining rules
- [ ] Confirm raw shadcn components are not business-specific
- [ ] Confirm themed components use CSS variables/theme tokens

## 1.4 Feature structure

Create each feature folder with consistent subfolders where needed:

- [x] `features/auth/`
- [x] `features/businesses/`
- [x] `features/locations/`
- [x] `features/menu/`
- [x] `features/products/`
- [x] `features/modifiers/`
- [x] `features/product-configurator/`
- [x] `features/cart/`
- [x] `features/checkout/`
- [x] `features/orders/`
- [x] `features/payments/`
- [x] `features/delivery/`
- [x] `features/specials/`
- [x] `features/website-builder/`
- [x] `features/themes/`
- [x] `features/media-library/`
- [x] `features/display-panels/`
- [x] `features/print-menus/`
- [x] `features/reports/`
- [x] `features/settings/`

For each feature:

- [ ] Add `components/` when UI exists
- [ ] Add `queries/` when reading data
- [ ] Add `actions/` when mutating data
- [ ] Add `schemas/` for validation
- [ ] Add `types/` for feature types
- [ ] Add `utils/` only when needed
- [ ] Keep route files thin

---

# 2. Supabase Project Setup

## 2.1 Supabase project

- [x] Create Supabase project
- [x] Record project URL
- [x] Record anon key in `.env.local`
- [ ] Record service role key securely, not committed
- [ ] Configure local Supabase CLI
- [ ] Link local project to Supabase project
- [x] Create `database/migrations/`
- [x] Create `database/seed/`
- [x] Create `database/types/`

## 2.2 Supabase clients

- [ ] Create browser Supabase client
- [ ] Create server Supabase client
- [ ] Create admin/service Supabase client for server-only operations
- [ ] Add environment variable validation
- [ ] Add typed database client placeholder
- [ ] Document Supabase client usage rules

## 2.3 Storage buckets

- [ ] Plan storage bucket names
- [ ] Create media bucket
- [ ] Create public assets bucket if needed
- [ ] Configure upload policies
- [ ] Configure read policies
- [ ] Test image upload manually
- [ ] Test image read manually

---

# 3. Database Schema Phase 1

## 3.1 Base extensions/helpers

- [ ] Enable required Postgres extensions
- [ ] Add `updated_at` trigger function
- [ ] Add common enum strategy or text-check strategy
- [ ] Decide on enum vs text constraints
- [ ] Add comments to major tables where useful

## 3.2 Users and tenants

- [ ] Create `profiles`
- [ ] Create `businesses`
- [ ] Create `business_users`
- [ ] Create `locations`
- [ ] Create `location_users`
- [ ] Add indexes for tenant lookups
- [ ] Add unique constraints for business slugs
- [ ] Add unique constraints for location slugs within business
- [ ] Add updated_at triggers

## 3.3 Hours and scheduling foundation

- [ ] Create `location_hours`
- [ ] Create `location_hour_overrides`
- [ ] Add indexes by location/date
- [ ] Add day-of-week validation
- [ ] Add time validation where appropriate

## 3.4 Media

- [ ] Create `media_assets`
- [ ] Add business/location indexes
- [ ] Add archive flag
- [ ] Add tags support
- [ ] Add upload ownership fields

## 3.5 Menu structure

- [ ] Create `menus`
- [ ] Create `menu_groups`
- [ ] Create `products`
- [ ] Create `product_groups`
- [ ] Create `product_variants`
- [ ] Add product prep-time fields
- [ ] Add product enabled/availability fields
- [ ] Add group visibility fields for website/print/display/order
- [ ] Add indexes for menu browsing
- [ ] Add constraints for variant sorting/defaults

## 3.6 Modifiers

- [ ] Create `modifier_groups`
- [ ] Create `modifier_options`
- [ ] Create `product_modifier_groups`
- [ ] Add fields for required/min/max selection
- [ ] Add support for placement
- [ ] Add support for multiplier
- [ ] Add support for min/max multiplier
- [ ] Add support for option prep-time deltas
- [ ] Add sort order fields

## 3.7 Modifier rules

- [ ] Create `product_modifier_option_price_rules`
- [ ] Create `product_modifier_option_availability_rules`
- [ ] Create `modifier_option_dependency_rules`
- [ ] Add location-specific rule support
- [ ] Add variant-specific rule support
- [ ] Add product-specific rule support
- [ ] Add selected-option dependency support
- [ ] Add indexes for configuration queries

## 3.8 Included modifiers

- [ ] Create `product_included_modifier_groups`
- [ ] Create `product_default_modifier_options`
- [ ] Add included quantity field
- [ ] Add swappable flag
- [ ] Add removable flag
- [ ] Add variant-specific support
- [ ] Add indexes

## 3.9 Related items

- [ ] Create `product_related_items`
- [ ] Add relationship type
- [ ] Add display label
- [ ] Add auto-remove with parent flag
- [ ] Add allow independent purchase flag
- [ ] Add min/max/default quantity
- [ ] Add visibility flags if needed
- [ ] Add sort order

## 3.10 Orders

- [ ] Create `orders`
- [ ] Create `order_items`
- [ ] Create `order_item_modifiers`
- [ ] Add order number
- [ ] Add customer fields
- [ ] Add fulfillment fields
- [ ] Add status fields
- [ ] Add pricing totals
- [ ] Add prep estimate fields
- [ ] Add requested/accepted/ready/completed/cancelled timestamps
- [ ] Add product snapshot fields
- [ ] Add modifier snapshot fields
- [ ] Add parent order item relationship for add-ons
- [ ] Add indexes for order search
- [ ] Add indexes for staff live order queue

## 3.11 Payments

- [ ] Create `payments`
- [ ] Create `payment_refunds`
- [ ] Add provider fields
- [ ] Add Stripe payment intent/session fields
- [ ] Add payment status
- [ ] Add refund status
- [ ] Add indexes by order/provider ID

---

# 4. Database Schema Phase 2

## 4.1 Delivery

- [ ] Create `delivery_zones`
- [ ] Create `order_delivery_details`
- [ ] Support radius zones
- [ ] Support postal-code zones
- [ ] Support future polygon geojson zones
- [ ] Add delivery fee
- [ ] Add minimum order amount
- [ ] Add estimated delivery minutes
- [ ] Add location indexes

## 4.2 Taxes, fees, tips

- [ ] Create `tax_rates`
- [ ] Create `fees`
- [ ] Create `tip_settings`
- [ ] Add per-location support
- [ ] Add enabled flags
- [ ] Add calculation utility stubs

## 4.3 Specials

- [ ] Create `specials`
- [ ] Create `special_schedules`
- [ ] Create `special_bundle_groups`
- [ ] Create `special_modifier_allowances`
- [ ] Support fixed-price specials
- [ ] Support discount specials
- [ ] Support bundle specials
- [ ] Support combo specials
- [ ] Support BOGO specials
- [ ] Support day/time/date availability
- [ ] Support location-specific specials

## 4.4 Website builder

- [ ] Create `pages`
- [ ] Create `page_sections`
- [ ] Create `navigation_items`
- [ ] Add draft/published status
- [ ] Add SEO fields
- [ ] Add nav visibility
- [ ] Add section content JSON
- [ ] Add section style JSON
- [ ] Add sort order
- [ ] Add page slug constraints

## 4.5 Themes

- [ ] Create `themes`
- [ ] Create `theme_versions`
- [ ] Add system theme support
- [ ] Add business theme support
- [ ] Add active theme support
- [ ] Add theme config JSON
- [ ] Add locked config JSON
- [ ] Seed starter themes
- [ ] Seed Classic Pizzeria
- [ ] Seed Modern Cafe
- [ ] Seed BBQ Smokehouse
- [ ] Seed Diner Retro
- [ ] Seed Upscale Bistro
- [ ] Seed Food Truck Pop
- [ ] Seed Artisan Coffee
- [ ] Seed Pizza & Coffee Hybrid

## 4.6 Notifications

- [ ] Create `notification_templates`
- [ ] Create `notification_logs`
- [ ] Add email template support
- [ ] Add SMS template support
- [ ] Add order confirmation template
- [ ] Add order ready template
- [ ] Add order cancelled template

---

# 5. Database Schema Phase 3

## 5.1 Printed menu builder

- [ ] Create `print_menus`
- [ ] Create `print_menu_sections`
- [ ] Add paper size
- [ ] Add orientation
- [ ] Add draft/published status
- [ ] Add theme reference
- [ ] Add category block support
- [ ] Add featured item block support
- [ ] Add text/image/divider support

## 5.2 Display panels

- [ ] Create `display_panels`
- [ ] Create `display_panel_sections`
- [ ] Add display type
- [ ] Add orientation
- [ ] Add screen size
- [ ] Add refresh interval
- [ ] Add duration per slide
- [ ] Add transition type
- [ ] Add published status

## 5.3 Audit logs

- [ ] Create `audit_logs`
- [ ] Add user ID
- [ ] Add entity type
- [ ] Add entity ID
- [ ] Add old values
- [ ] Add new values
- [ ] Add action
- [ ] Add indexes by business/entity

## 5.4 Optional ad management

- [D] Create `advertisers`
- [D] Create `advertisements`
- [D] Add placement scheduling
- [D] Add paid flag
- [D] Add price
- [D] Add display panel placement support

---

# 6. Row Level Security

## 6.1 RLS setup

- [ ] Enable RLS on tenant-owned tables
- [ ] Create helper function for business membership
- [ ] Create helper function for business role
- [ ] Create helper function for location access
- [ ] Create helper function for admin access
- [ ] Create helper function for staff access

## 6.2 Public read policies

- [ ] Public can read enabled business storefront data
- [ ] Public can read enabled locations
- [ ] Public can read enabled menus/groups/products
- [ ] Public can read enabled pages and sections
- [ ] Public can read active theme
- [ ] Public cannot read private admin data
- [ ] Public cannot read orders

## 6.3 Admin policies

- [ ] Owners can manage business
- [ ] Admins can manage business configuration
- [ ] Managers can manage assigned locations
- [ ] Marketing users can manage pages/themes/media only
- [ ] Staff cannot manage site/menu unless given permission

## 6.4 Staff policies

- [ ] Staff can read orders for assigned location
- [ ] Staff can update order status for assigned location
- [ ] Staff can search order history for assigned location
- [ ] Staff cannot access other locations unless assigned
- [ ] Staff cannot change payment settings

## 6.5 Customer/order policies

- [ ] Public checkout can create order safely through server action/API
- [ ] Order writes validate business/location/product rules server-side
- [ ] Customers cannot arbitrarily update orders
- [ ] Payment webhooks can update payment status securely

---

# 7. Generated Database Types

- [ ] Generate Supabase TypeScript types
- [ ] Save generated types in `database/types/`
- [ ] Add script to regenerate types
- [ ] Import database types into Supabase clients
- [ ] Confirm type-safe queries compile

---

# 8. Authentication and Roles

## 8.1 Auth setup

- [ ] Configure Supabase Auth
- [ ] Create sign-in page
- [ ] Create sign-out action
- [ ] Create forgot password page
- [ ] Create reset password page
- [ ] Create auth callback route if needed
- [ ] Protect admin routes
- [ ] Protect staff routes
- [ ] Redirect users based on role

## 8.2 Profiles

- [ ] Create profile automatically after signup/invite
- [ ] Add profile edit screen
- [ ] Add avatar support optional
- [ ] Add phone number field

## 8.3 Role management

- [ ] Create owner role
- [ ] Create admin role
- [ ] Create manager role
- [ ] Create staff role
- [ ] Create marketing role
- [ ] Build invite user flow
- [ ] Build disable user flow
- [ ] Build assign user to location flow
- [ ] Build remove user from location flow

---

# 9. Admin Shell

- [ ] Build admin layout shell
- [ ] Build sidebar navigation
- [ ] Build top bar
- [ ] Build business switcher if needed
- [ ] Build location switcher
- [ ] Build user menu
- [ ] Build breadcrumbs
- [ ] Build admin dashboard home
- [ ] Build consistent page header component
- [ ] Build empty state component
- [ ] Build loading state component
- [ ] Build error state component

---

# 10. Business and Location Management

## 10.1 Business setup

- [ ] Create business settings screen
- [ ] Edit business name
- [ ] Edit business slug
- [ ] Upload logo
- [ ] Upload favicon
- [ ] Edit description
- [ ] Edit contact info

## 10.2 Locations

- [ ] Create locations list
- [ ] Create add location form
- [ ] Create edit location form
- [ ] Enable/disable location
- [ ] Toggle accepting orders
- [ ] Toggle pickup
- [ ] Toggle delivery
- [ ] Add location address fields
- [ ] Add location phone/email
- [ ] Add timezone
- [ ] Add lat/lng fields
- [ ] Add Google Place ID
- [ ] Add Google Maps URL
- [ ] Add Google Review URL
- [ ] Allow location managers to invite staff for their location
- [ ] Allow location managers to disable staff for their location
- [ ] Prevent location managers from managing owners/admins
- [ ] Prevent location managers from managing other locations

## 10.3 Hours

- [ ] Build weekly hours editor
- [ ] Build holiday/special hours editor
- [ ] Validate open/close times
- [ ] Support closed days
- [ ] Show hours on public site

---

# 11. Media Library

- [ ] Build media library page
- [ ] Build upload button
- [ ] Build drag/drop upload
- [ ] Save file to Supabase Storage
- [ ] Save metadata to `media_assets`
- [ ] Display image grid
- [ ] Search by filename
- [ ] Filter by folder/tag
- [ ] Edit alt text
- [ ] Edit caption
- [ ] Archive asset
- [ ] Build reusable media picker modal
- [ ] Use media picker in product form
- [ ] Use media picker in page builder
- [ ] Use media picker in theme editor

---

# 12. Menu Management

## 12.1 Menus

- [ ] Build menus list
- [ ] Add menu
- [ ] Edit menu
- [ ] Enable/disable menu
- [ ] Assign menu to business or location
- [ ] Sort menus

## 12.2 Menu groups

- [ ] Build menu group tree
- [ ] Add top-level group
- [ ] Add subgroup
- [ ] Edit group
- [ ] Enable/disable group
- [ ] Set group image
- [ ] Set group description
- [ ] Set show online flag
- [ ] Set show print flag
- [ ] Set show display flag
- [ ] Reorder groups
- [ ] Assign products to groups

## 12.3 Products

- [ ] Build products list
- [ ] Search products
- [ ] Filter by group
- [ ] Filter by enabled status
- [ ] Add product
- [ ] Edit product
- [ ] Duplicate product
- [ ] Enable/disable product
- [ ] Set product image
- [ ] Set product description
- [ ] Set product taxable flag
- [ ] Set product featured flag
- [ ] Set product prep time
- [ ] Assign product to groups
- [ ] Set primary group

## 12.4 Product variants

- [ ] Add variants to product
- [ ] Edit variant
- [ ] Delete/disable variant
- [ ] Set variant name
- [ ] Set variant type
- [ ] Set unit type
- [ ] Set unit quantity
- [ ] Set unit label
- [ ] Set base price
- [ ] Set prep time
- [ ] Set default variant
- [ ] Reorder variants

---

# 13. Modifier Management

## 13.1 Modifier groups

- [ ] Build modifier group list
- [ ] Add modifier group
- [ ] Edit modifier group
- [ ] Enable/disable group
- [ ] Set selection type
- [ ] Set required flag
- [ ] Set min required
- [ ] Set max allowed
- [ ] Set placement support
- [ ] Set multiplier support
- [ ] Set min multiplier
- [ ] Set max multiplier
- [ ] Set multiplier step
- [ ] Reorder groups

## 13.2 Modifier options

- [ ] Add modifier option
- [ ] Edit modifier option
- [ ] Enable/disable option
- [ ] Set default price delta
- [ ] Set prep time delta
- [ ] Reorder options

## 13.3 Assign modifiers to products

- [ ] Build product modifier assignment UI
- [ ] Assign modifier group to product
- [ ] Reorder product modifier groups
- [ ] Enable/disable modifier group per product
- [ ] Configure required behavior per product if needed

## 13.4 Modifier price rules

- [ ] Build price rule editor
- [ ] Set product-specific option price
- [ ] Set variant-specific option price
- [ ] Set location-specific option price
- [ ] Set prep-time override
- [ ] Display resolved price in admin preview
- [ ] Test ham pizza/salad/sub example

## 13.5 Modifier availability rules

- [ ] Build availability rule editor
- [ ] Set option available by product
- [ ] Set option available by variant
- [ ] Set option available by location
- [ ] Set dependency on another modifier option
- [ ] Test gluten-free only on 10 inch pizza
- [ ] Test crust style filtered by crust type

---

# 14. Included Modifiers and Credits

- [ ] Build default modifier editor
- [ ] Allow admin to select default toppings/options
- [ ] Set whether default option is removable
- [ ] Build included allowance editor
- [ ] Set included quantity
- [ ] Set swappable yes/no
- [ ] Set charge for extras yes/no
- [ ] Support variant-specific included rules
- [ ] Test pepperoni remove/re-add no charge
- [ ] Test pepperoni swapped for sausage no charge
- [ ] Test extra topping charges correctly
- [ ] Test non-swappable specialty item behavior

---

# 15. Related Add-ons

- [ ] Build related items editor
- [ ] Select source product
- [ ] Select related product
- [ ] Set relationship type
- [ ] Set display label
- [ ] Set auto-remove with parent
- [ ] Set allow independent purchase
- [ ] Set required flag
- [ ] Set min quantity
- [ ] Set max quantity
- [ ] Set default quantity
- [ ] Reorder related items
- [ ] Test wings with sauce cups
- [ ] Test removing wings removes dependent cups
- [ ] Test independent add-on remains when parent removed

---

# 16. Product Configuration Engine

## 16.1 Core engine

- [ ] Create engine folder
- [ ] Define product configuration input types
- [ ] Define resolved configuration output types
- [ ] Load product
- [ ] Load variants
- [ ] Load modifier groups
- [ ] Load modifier options
- [ ] Load price rules
- [ ] Load availability rules
- [ ] Load dependency rules
- [ ] Load included modifier rules
- [ ] Load related items

## 16.2 Resolution logic

- [ ] Resolve available variants
- [ ] Resolve available modifier groups
- [ ] Resolve available modifier options by selected variant
- [ ] Resolve dependency-based options
- [ ] Resolve default selections
- [ ] Resolve included credits
- [ ] Resolve modifier price
- [ ] Resolve placement rules
- [ ] Resolve multiplier rules
- [ ] Resolve prep time
- [ ] Resolve related item options

## 16.3 Validation logic

- [ ] Validate selected variant
- [ ] Validate required modifier groups
- [ ] Validate min selections
- [ ] Validate max selections
- [ ] Validate placement allowed
- [ ] Validate multiplier allowed
- [ ] Validate dependencies
- [ ] Validate unavailable options cannot be submitted
- [ ] Validate included credits
- [ ] Validate final price server-side

## 16.4 Test scenarios

- [ ] Build Your Own Pizza
- [ ] Specialty Pepperoni Pizza
- [ ] Deluxe pizza with 3+ included toppings
- [ ] Gluten-free crust only on 10 inch
- [ ] Traditional wings by piece count
- [ ] Boneless wings by pound
- [ ] Subs with 6 inch/12 inch variants
- [ ] Salad with dressing and protein add-ons
- [ ] Coffee with size, milk, flavor, extra espresso

---

# 17. Customer Public Site

## 17.1 Public layout

- [ ] Build business storefront route
- [ ] Build location selection route/section
- [ ] Build themed navbar
- [ ] Build themed footer
- [ ] Apply active business theme
- [ ] Add responsive mobile nav
- [ ] Add SEO metadata

## 17.2 Home page

- [ ] Render published home page
- [ ] Render hero section
- [ ] Render featured items
- [ ] Render specials preview
- [ ] Render location selector
- [ ] Render Google review section if configured
- [ ] Render map section if configured
- [ ] Render CTA section

## 17.3 Menu page

- [ ] Render menu groups
- [ ] Render nested categories/subcategories
- [ ] Render product cards
- [ ] Hide disabled products
- [ ] Hide disabled groups
- [ ] Show product images
- [ ] Show variant starting price
- [ ] Add category navigation
- [ ] Add mobile-friendly category tabs

## 17.4 Product configurator UI

- [ ] Open product modal/page
- [ ] Show product image/description
- [ ] Show variants
- [ ] Show required modifier groups
- [ ] Show optional modifier groups
- [ ] Filter modifiers based on selected variant
- [ ] Filter modifiers based on dependencies
- [ ] Show topping placement controls
- [ ] Show multiplier controls
- [ ] Show live price
- [ ] Show prep-time estimate if desired
- [ ] Show related add-ons
- [ ] Validate before add to cart
- [ ] Add configured item to cart

---

# 18. Cart

- [ ] Create cart state management
- [ ] Add item to cart
- [ ] Edit configured item
- [ ] Remove item
- [ ] Remove dependent add-ons when parent removed
- [ ] Keep independent add-ons when configured
- [ ] Update quantities
- [ ] Recalculate totals
- [ ] Persist cart locally
- [ ] Clear cart after successful order
- [ ] Prevent checkout with unavailable items
- [ ] Show cart drawer/page
- [ ] Show item configuration summary
- [ ] Show modifier placement/multiplier summary
- [ ] Show add-ons indented under parent where appropriate

---

# 19. Checkout

## 19.1 Fulfillment

- [ ] Choose pickup or delivery
- [ ] Validate pickup enabled
- [ ] Validate delivery enabled
- [ ] Select requested time or ASAP
- [ ] Validate location accepting orders
- [ ] Validate business hours
- [ ] Validate pickup/delivery hours
- [ ] Calculate prep time
- [ ] Calculate estimated ready time

## 19.2 Customer info

- [ ] Collect name
- [ ] Collect phone
- [ ] Collect email
- [ ] Collect order notes
- [ ] Validate required customer fields

## 19.3 Delivery

- [ ] Collect delivery address
- [ ] Validate address fields
- [ ] Geocode address later or stub initially
- [ ] Check radius delivery zone
- [ ] Apply delivery fee
- [ ] Apply minimum order amount
- [ ] Collect delivery instructions

## 19.4 Totals

- [ ] Calculate subtotal
- [ ] Apply specials/discounts later
- [ ] Calculate taxes
- [ ] Calculate fees
- [ ] Calculate delivery fee
- [ ] Calculate tip
- [ ] Calculate final total
- [ ] Show full order summary

---

# 20. Stripe Payments

- [ ] Create Stripe account
- [ ] Add Stripe keys to environment
- [ ] Install Stripe package
- [ ] Create payment intent route/action
- [ ] Create checkout payment component
- [ ] Connect payment to order
- [ ] Store payment record
- [ ] Add Stripe webhook endpoint
- [ ] Verify webhook signatures
- [ ] Update payment status from webhook
- [ ] Update order payment status
- [ ] Handle failed payment
- [ ] Handle successful payment
- [ ] Test card payment
- [ ] Test failed payment
- [ ] Test webhook locally
- [ ] Build refund data model support
- [ ] Build admin refund action later

---

# 21. Order Creation

- [ ] Create server-side order validation
- [ ] Validate business/location
- [ ] Validate cart items
- [ ] Validate product availability
- [ ] Validate variant availability
- [ ] Validate modifier availability
- [ ] Validate pricing server-side
- [ ] Validate totals server-side
- [ ] Create order record
- [ ] Create order item records
- [ ] Create order item modifier records
- [ ] Create delivery details if delivery
- [ ] Generate order number
- [ ] Store snapshots
- [ ] Return order confirmation
- [ ] Show confirmation page

---

# 22. Staff Dashboard

## 22.1 Staff shell

- [ ] Build staff login redirect
- [ ] Build staff layout
- [ ] Build location-scoped staff navigation
- [ ] Build large touch-friendly UI

## 22.2 Live order queue

- [ ] Show new orders
- [ ] Show accepted orders
- [ ] Show preparing orders
- [ ] Show ready orders
- [ ] Show completed/cancelled filter
- [ ] Subscribe to new orders with Supabase Realtime if appropriate
- [ ] Play/trigger visual alert for new order
- [ ] Open order detail
- [ ] Accept order
- [ ] Mark preparing
- [ ] Mark ready
- [ ] Mark completed
- [ ] Cancel order with reason
- [ ] Print kitchen ticket optional
- [ ] Reprint receipt optional

## 22.3 Order history

- [ ] Build staff order history page
- [ ] Search by order number
- [ ] Search by customer name
- [ ] Search by phone
- [ ] Filter by date range
- [ ] Filter by status
- [ ] Filter by pickup/delivery
- [ ] View order details
- [ ] Reprint receipt/ticket

---

# 23. Admin Orders

- [ ] Build admin orders page
- [ ] View all business orders
- [ ] Filter by location
- [ ] Filter by date range
- [ ] Filter by status
- [ ] Filter by payment status
- [ ] Search by customer
- [ ] Search by item
- [ ] View order details
- [ ] View payment details
- [ ] Issue refund later
- [ ] Export CSV later

---

# 24. Website Builder

## 24.1 Pages

- [ ] Build pages list
- [ ] Add page
- [ ] Edit page title
- [ ] Edit slug
- [ ] Set show in nav
- [ ] Set nav label
- [ ] Set SEO title
- [ ] Set SEO description
- [ ] Draft page
- [ ] Preview page
- [ ] Publish page
- [ ] Archive page
- [ ] Delete page only if safe

## 24.2 Sections

- [ ] Add section dialog
- [ ] Section list
- [ ] Reorder sections
- [ ] Enable/disable section
- [ ] Edit section content
- [ ] Edit section style
- [ ] Preview section
- [ ] Delete section

## 24.3 Section types

- [ ] Hero section
- [ ] Text section
- [ ] Image section
- [ ] Image + text section
- [ ] Gallery section
- [ ] Card grid section
- [ ] Menu preview section
- [ ] Hours section
- [ ] Google map section
- [ ] Google reviews section
- [ ] CTA section
- [ ] Custom local business/ad card section

## 24.4 Navigation

- [ ] Build navigation editor
- [ ] Add nav item
- [ ] Link nav item to page
- [ ] Link nav item to external URL
- [ ] Reorder nav items
- [ ] Enable/disable nav item
- [ ] Support nested nav item later

---

# 25. Theme System

## 25.1 Theme foundation

- [ ] Define theme token shape
- [ ] Define required CSS variables
- [ ] Build ThemeProvider
- [ ] Build server-side theme loader
- [ ] Inject CSS variables
- [ ] Build fallback theme
- [ ] Apply theme to public site
- [ ] Keep admin theme stable

## 25.2 Themed components

- [ ] Create `ThemedButton`
- [ ] Create `ThemedCard`
- [ ] Create `ThemedSection`
- [ ] Create `ThemedHero`
- [ ] Create `ThemedMenuItemCard`
- [ ] Create `ThemedProductGrid`
- [ ] Create `ThemedNavBar`
- [ ] Create `ThemedFooter`
- [ ] Create `ThemedBadge`
- [ ] Create `ThemedPrice`

## 25.3 Theme admin

- [ ] Build theme list
- [ ] Preview theme
- [ ] Activate theme
- [ ] Duplicate theme
- [ ] Edit theme colors
- [ ] Edit theme fonts
- [ ] Edit button styles
- [ ] Edit card styles
- [ ] Edit nav style
- [ ] Respect locked tokens
- [ ] Save theme version

---

# 26. Specials

## 26.1 Specials admin

- [ ] Build specials list
- [ ] Add special
- [ ] Choose special type
- [ ] Edit name/description/image
- [ ] Enable/disable special
- [ ] Set location scope
- [ ] Set start/end dates
- [ ] Set schedule rules
- [ ] Set cannot-combine flag

## 26.2 Special templates

- [ ] Fixed-price item special
- [ ] Simple discount special
- [ ] Bundle special
- [ ] Combo special
- [ ] BOGO special
- [ ] Limited-time feature special

## 26.3 Bundle logic

- [ ] Build bundle group editor
- [ ] Choose allowed products/groups
- [ ] Set quantity required
- [ ] Set required variant
- [ ] Set included modifier allowance
- [ ] Set extra modifier behavior
- [ ] Test 2 large 3-topping pizzas
- [ ] Validate special server-side
- [ ] Apply special to cart/order

---

# 27. Delivery

- [ ] Build delivery settings page
- [ ] Toggle delivery per location
- [ ] Set delivery radius
- [ ] Set flat delivery fee
- [ ] Set minimum order amount
- [ ] Set estimated delivery minutes
- [ ] Validate delivery address against radius
- [ ] Add postal-code delivery support
- [ ] Add delivery zone list
- [ ] Add polygon drawing later
- [ ] Add delivery hours separate from pickup if needed

---

# 28. Taxes, Fees, Tips

- [ ] Build tax settings page
- [ ] Add tax rate
- [ ] Edit tax rate
- [ ] Enable/disable tax rate
- [ ] Apply tax to food
- [ ] Apply tax to delivery if configured
- [ ] Build fees settings page
- [ ] Add flat fee
- [ ] Add percentage fee
- [ ] Configure pickup/delivery/all applicability
- [ ] Build tip settings page
- [ ] Toggle tips
- [ ] Set suggested percentages
- [ ] Allow custom tip
- [ ] Test checkout totals

---

# 29. Notifications

- [ ] Decide email provider
- [ ] Decide SMS provider later
- [ ] Build notification templates page
- [ ] Send order confirmation email
- [ ] Send order ready notification later
- [ ] Log notification attempts
- [ ] Handle notification failure gracefully
- [ ] Allow admin to enable/disable templates

---

# 30. Reports

- [ ] Build reports dashboard
- [ ] Sales by date range
- [ ] Orders by date range
- [ ] Sales by location
- [ ] Top products
- [ ] Sales by category
- [ ] Specials performance
- [ ] Delivery vs pickup totals
- [ ] Tax totals
- [ ] Tip totals
- [ ] Refund totals
- [ ] Export CSV

---

# 31. Printed Menu Builder

- [ ] Build print menu list
- [ ] Add print menu
- [ ] Choose paper size
- [ ] Choose orientation
- [ ] Choose theme
- [ ] Add category block
- [ ] Add featured item block
- [ ] Add text block
- [ ] Add image block
- [ ] Add divider block
- [ ] Reorder blocks
- [ ] Preview print menu
- [ ] Export/print PDF
- [ ] Hide disabled products
- [ ] Use live product data

---

# 32. Display Panels

- [ ] Build display panel list
- [ ] Add display panel
- [ ] Set location
- [ ] Set slug
- [ ] Set display type
- [ ] Set orientation
- [ ] Set refresh interval
- [ ] Add display sections/slides
- [ ] Add static panel support
- [ ] Add scrolling panel support
- [ ] Add slideshow panel support
- [ ] Add product board support
- [ ] Preview display
- [ ] Publish display
- [ ] Render public display URL
- [ ] Auto-hide disabled products
- [ ] Add QR code section

---

# 33. Google Maps and Reviews

- [ ] Add location Google Place ID field
- [ ] Add Google Maps URL field
- [ ] Add Google Review URL field
- [ ] Build Google map page section
- [ ] Build directions button
- [ ] Build Google reviews page section
- [ ] Show rating/review count if configured
- [ ] Add leave-review button
- [ ] Use official Google APIs if showing review snippets
- [ ] Do not scrape reviews

---

# 34. Performance and Reliability

- [ ] Add loading skeletons
- [ ] Add optimistic UI where safe
- [ ] Add server-side validation for all checkout pricing
- [ ] Add caching strategy for public menus
- [ ] Add cache invalidation after menu/theme/page publish
- [ ] Add error logging
- [ ] Add graceful payment failure handling
- [ ] Add display panel fallback state
- [ ] Add order creation transaction pattern
- [ ] Add webhook idempotency

---

# 35. Accessibility and Mobile

- [ ] Test keyboard navigation
- [ ] Check color contrast
- [ ] Ensure buttons have accessible labels
- [ ] Ensure dialogs are accessible
- [ ] Ensure form errors are announced/readable
- [ ] Test mobile menu browsing
- [ ] Test mobile product configurator
- [ ] Test mobile checkout
- [ ] Test staff dashboard on tablet
- [ ] Test display panels on large screens

---

# 36. Testing

## 36.1 Unit tests

- [ ] Test pricing resolver
- [ ] Test modifier availability resolver
- [ ] Test dependency resolver
- [ ] Test included credits
- [ ] Test related add-on removal
- [ ] Test prep-time calculation
- [ ] Test delivery radius logic
- [ ] Test tax/fee/tip totals

## 36.2 Integration tests

- [ ] Test product configuration end-to-end
- [ ] Test cart to checkout
- [ ] Test order creation
- [ ] Test payment success
- [ ] Test payment failure
- [ ] Test staff order update
- [ ] Test admin menu update affects public menu

## 36.3 Manual acceptance tests

- [ ] Place pickup order
- [ ] Place delivery order
- [ ] Configure specialty pizza
- [ ] Configure gluten-free 10 inch pizza
- [ ] Configure wings by pound
- [ ] Configure wings by piece count
- [ ] Add/remove related sauce cups
- [ ] Admin disables item and it disappears
- [ ] Admin updates theme and storefront changes
- [ ] Admin creates custom page
- [ ] Staff searches past order

---

# 37. Deployment

- [ ] Choose hosting provider
- [ ] Configure production environment variables
- [ ] Connect GitHub repository
- [ ] Deploy preview environment
- [ ] Deploy production environment
- [ ] Configure Supabase production project
- [ ] Apply migrations to production
- [ ] Configure Stripe production keys
- [ ] Configure Stripe webhooks
- [ ] Configure custom domain support later
- [ ] Add deployment documentation

---

# 38. MVP Completion Criteria

The MVP is complete when:

- [ ] Business can be created
- [ ] Location can be created
- [ ] Admin can log in
- [ ] Staff can log in
- [ ] Menu groups can be created
- [ ] Products can be created
- [ ] Product variants can be created
- [ ] Modifier groups/options can be created
- [ ] Product configuration works for pizza
- [ ] Customer can browse menu
- [ ] Customer can configure item
- [ ] Customer can add to cart
- [ ] Customer can checkout for pickup
- [ ] Customer can pay with Stripe
- [ ] Order appears in staff dashboard
- [ ] Staff can update order status
- [ ] Order history can be searched
- [ ] Basic public theme is applied
- [ ] Disabled products/options do not appear

---

# 39. V1 Completion Criteria

V1 is complete when:

- [ ] Delivery works
- [ ] Specials work at least for fixed/bundle cases
- [ ] Website page builder works
- [ ] Media library works
- [ ] Theme editor works at basic level
- [ ] Google map/review sections work
- [ ] Admin reports exist
- [ ] Taxes/fees/tips are configurable
- [ ] Notifications send order confirmations
- [ ] Multi-location support is reliable

---

# 40. Full Platform Completion Criteria

The full platform is complete when:

- [ ] Printed menu builder works
- [ ] Display panel builder works
- [ ] Advanced specials work
- [ ] Advanced delivery zones work
- [ ] Theme versioning works
- [ ] Draft/preview/publish works for pages/themes/menus/displays
- [ ] Reporting is business-useful
- [ ] Staff/admin permissions are polished
- [ ] Custom domains are supported if desired
- [ ] Performance is acceptable under real ordering load
- [ ] App is ready to market to real businesses

---

# 41. Future Enhancements Post-MVP / Post-V1

## 41.1 Platform Infrastructure

- [ ] Implement automated backups
- [ ] Document backup restore process
- [ ] Implement migration rollback strategy
- [ ] Set up staging environment
- [ ] Separate local/staging/production environment variables
- [ ] Add error monitoring system
- [ ] Add webhook failure monitoring
- [ ] Add rate limiting
- [ ] Add abuse protection for forms/uploads/checkout/login

## 41.2 Data and Observability

- [ ] Build order event log system
- [ ] Log order created event
- [ ] Log payment succeeded event
- [ ] Log payment failed event
- [ ] Log order accepted event
- [ ] Log order preparing event
- [ ] Log order ready event
- [ ] Log order completed event
- [ ] Log order cancelled event
- [ ] Log refund events
- [ ] Build audit log UI
- [ ] Expand reporting dashboards
- [ ] Add CSV export tools
- [ ] Add menu import from CSV
- [ ] Add menu export
- [ ] Add product import/export

## 41.3 Platform Owner Tools

- [ ] Build platform owner dashboard
- [ ] Show all businesses
- [ ] Show business status
- [ ] Show subscription status
- [ ] Show basic health checks
- [ ] Add support impersonation mode
- [ ] Add support access audit trail
- [ ] Add business suspension/reactivation controls

## 41.4 Monetization

- [ ] Implement Stripe subscription billing
- [ ] Add trial periods
- [ ] Add plan tiers
- [ ] Add feature gating by plan
- [ ] Add billing status to business records
- [ ] Add subscription management page
- [ ] Add failed billing handling

## 41.5 Customization and Branding

- [ ] Implement custom domains
- [ ] Add domain verification flow
- [ ] Add theme versioning UI
- [ ] Add page version history
- [ ] Add menu version history
- [ ] Add display panel version history
- [ ] Add restore previous version action

## 41.6 Legal and Compliance

- [ ] Add terms of service page/template
- [ ] Add privacy policy page/template
- [ ] Add cookie notice if needed
- [ ] Add refund policy management
- [ ] Add delivery policy management
- [ ] Add business-specific policy display sections

## 41.7 Operations

- [ ] Build kitchen ticket formatting
- [ ] Build receipt formatting
- [ ] Add printer support/integration
- [ ] Add advanced order throttling
- [ ] Add max orders per time slot
- [ ] Add rush-mode prep time controls
- [ ] Add temporary pause ordering controls

## 41.8 Accessibility and QA

- [ ] Perform accessibility audit
- [ ] Improve keyboard navigation
- [ ] Improve screen reader support
- [ ] Add load testing
- [ ] Add stress testing for pricing engine
- [ ] Add stress testing for product configuration engine
- [ ] Expand edge case test suite
