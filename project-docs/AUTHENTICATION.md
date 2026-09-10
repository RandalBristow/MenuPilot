# Workforce Authentication

MenuPilot uses a separate workforce login at `/login`. Customer ordering remains public and does not share the workforce login UI.

## Role destinations

- Platform owner: `/platform`
- Business owner/admin: `/businesses/[businessSlug]/admin`
- Manager: `/businesses/[businessSlug]/locations/[locationSlug]/manager`
- Staff: `/businesses/[businessSlug]/locations/[locationSlug]/orders`
- Users with multiple available workspaces: `/access`

Platform ownership is controlled by the server-only `PLATFORM_OWNER_EMAILS` environment variable. Use a comma-separated list of Supabase Auth email addresses. Configure it locally and in Vercel; never expose it with a `NEXT_PUBLIC_` prefix.

Supabase Auth must allow the deployed site URL and these redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://[production-domain]/auth/callback`

Employee invitations and password resets return through `/auth/callback` and then open `/auth/update-password`.

## Local development

`.env.development.local` enables `DEV_AUTH_BYPASS=true`. The bypass additionally requires `NODE_ENV=development` and a request host of `localhost` or `127.0.0.1`; it cannot operate in a production build or on Vercel.

Open `/dev/access` or use the **Switch Role** control to choose a role, business, and location without repeatedly signing in. The selected development identity is stored in an HTTP-only, same-site cookie. Real Supabase sessions also persist in cookies, so normal development login survives page refreshes and dev-server restarts.

Do not configure `DEV_AUTH_BYPASS` in Vercel.
