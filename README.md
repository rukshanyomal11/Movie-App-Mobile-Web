# CineBook Admin Website

This `website` folder now contains an admin-only React dashboard for the movie booking project.

## What is inside

- Supabase admin login
- Dashboard summary from live database data
- Today movie management through Supabase
- Service management through Supabase
- Mobile app user list from `app_users`
- Booking details from `bookings`
- Shared database guidance panel

## Run the admin website

```bash
npm install
npm run dev
```

## Required environment values

Create `website/.env` with:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## Important note

This dashboard no longer uses local demo arrays.

Before login works, your Supabase project must have:

1. a Supabase Auth user for the admin email
2. a matching row in `app_users` with `role = 'admin'`

Use the SQL files in:

- `../shared-database/schema.sql`
- `../shared-database/sample-data.sql`
- `../shared-database/README.md`

## Shared database plan

The correct architecture for your project is:

1. React admin website
2. Flutter mobile app
3. One shared Supabase PostgreSQL database
4. One shared auth/backend layer

That way:

- admin updates movies and services once
- mobile app reads the same movies and services
- user bookings go to the same database
- admin can see users and booking details immediately
