# Jin and Shein's Recipe Vault

A private, installable recipe vault built with Next.js, TypeScript, and
Supabase. Recipes are shared between authenticated users and include categories,
tags, favorites, photos, search, filtering, and sorting.

## Stack

- Next.js App Router
- Supabase Auth, Postgres, and Storage
- Plain CSS ported from the original browser-only app
- Installable PWA with runtime caching for app assets

## Local setup

1. Install Node.js 22 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

4. In Supabase, open the project Connect dialog and put its URL and publishable
   key in `.env.local`. Legacy projects may use
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Add the service-role key only for the one-time migration route. Never expose
   it in a `NEXT_PUBLIC_` variable or commit `.env.local`.
6. Start the app:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:3000`.

## Expected Supabase resources

The app expects:

- A `public.recipes` table matching the schema in [EPIC.md](./EPIC.md)
- Row-level-security policies allowing authenticated recipe CRUD
- A public Storage bucket named `recipe-photos`
- Authenticated upload and delete policies on that bucket
- At least one email/password user

The application uses current Supabase publishable keys and also supports the
legacy anon-key environment variable documented in the original epic.

## Old recipe migration

Set `MIGRATION_ENABLED=true` and provide `SUPABASE_SERVICE_ROLE_KEY`, then sign
in and visit `/migrate`. The page accepts the old `recipe-vault-v1`
`localStorage` JSON and uploads embedded photos to Supabase Storage.

After verifying the imported recipes:

1. Set `MIGRATION_ENABLED=false`.
2. Remove `SUPABASE_SERVICE_ROLE_KEY` from the deployed application if it is no
   longer needed.
3. Redeploy.

## Verification

```bash
npm run lint
npm run build
```

Production also requires the environment variables to be configured in the
deployment platform.
