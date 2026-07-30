# Full-Stack Upgrade Epic: Jin & Shein's Recipe Vault

## Agent Prompt

You are building a full-stack upgrade of an existing vanilla JS recipe PWA located at `/Users/jkim/Repos/recipe-app`. Your job is to rewrite it as a Next.js + Supabase app and deploy it to Vercel. Do the entire implementation, then deploy. Here is everything you need to know.

---

### What exists today

**Files:**
- `/Users/jkim/Repos/recipe-app/index.html` — HTML structure (form, cards, overlay modal) to convert to JSX
- `/Users/jkim/Repos/recipe-app/app.js` — all business logic, state management, rendering (494 lines, port this to React)
- `/Users/jkim/Repos/recipe-app/styles.css` — design system with CSS variables; copy verbatim
- `/Users/jkim/Repos/recipe-app/service-worker.js` — cache-first PWA caching strategy
- `/Users/jkim/Repos/recipe-app/manifest.webmanifest` — "Jin and Shein's Recipe Vault", theme `#1f8a5b`, bg `#fef8ef`
- `/Users/jkim/Repos/recipe-app/icons/` — icon-192.svg and icon-512.svg

**Current data shape (localStorage key: `recipe-vault-v1`):**
```typescript
interface Recipe {
  id: string;            // UUID
  createdAt: number;     // Unix ms timestamp
  favorite: boolean;
  photo: string;         // base64 data URL or ""
  name: string;          // max 80 chars
  category: string;      // "Auggie" | "Dessert" | "Breakfast" | "Lunch/Dinner" | ""
  tags: string[];
  ingredients: string[];
  instructions: string;
  notes: string;
}
```

---

### Tech stack to build

- **Frontend:** Next.js 14+ App Router with TypeScript
- **Database + Auth + Storage:** Supabase (free tier)
- **Deployment:** Vercel
- **Styling:** Port `styles.css` directly — no Tailwind, no CSS-in-JS
- **No ORM, no tRPC, no Redux** — keep it small

---

### Supabase SQL schema

Run this in the Supabase Dashboard SQL Editor after creating a new project:

```sql
create extension if not exists "pgcrypto";

create table public.recipes (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  name         text not null check (char_length(name) <= 80),
  category     text check (category in ('Auggie', 'Dessert', 'Breakfast', 'Lunch/Dinner')),
  tags         text[] not null default '{}',
  ingredients  text[] not null default '{}',
  instructions text not null default '',
  notes        text not null default '',
  photo_url    text,
  favorite     boolean not null default false,
  created_by   uuid references auth.users(id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

alter table public.recipes enable row level security;

create policy "authenticated users can read all recipes"
  on public.recipes for select to authenticated using (true);
create policy "authenticated users can insert recipes"
  on public.recipes for insert to authenticated with check (true);
create policy "authenticated users can update recipes"
  on public.recipes for update to authenticated using (true);
create policy "authenticated users can delete recipes"
  on public.recipes for delete to authenticated using (true);

create index recipes_created_at_idx on public.recipes (created_at desc);
create index recipes_favorite_idx   on public.recipes (favorite) where favorite = true;
create index recipes_category_idx   on public.recipes (category);
```

Also in Supabase Storage: create a bucket named `recipe-photos` with Public = true, then add:
- Policy: public can SELECT from `recipe-photos`
- Policy: authenticated users can INSERT into `recipe-photos`
- Policy: authenticated users can DELETE from `recipe-photos`

In Supabase Auth: disable "Confirm email" in Auth settings. Create app users manually as needed.

---

### Environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
MIGRATION_ENABLED=true
```

---

### Project file structure to create

```
recipe-app/
├── app/
│   ├── layout.tsx                # Root layout, load fonts, PWA meta tags
│   ├── page.tsx                  # Home: recipe grid + form shell
│   ├── login/page.tsx            # Login form (email + password)
│   ├── migrate/page.tsx          # One-time migration UI (paste JSON)
│   └── api/
│       ├── recipes/route.ts      # GET (list+filter) + POST (create)
│       ├── recipes/[id]/route.ts # PUT (update) + DELETE
│       ├── recipes/[id]/favorite/route.ts  # PATCH (toggle)
│       ├── upload/route.ts       # POST photo → Supabase Storage
│       └── migrate/route.ts      # POST localStorage JSON → DB (one-time)
├── components/
│   ├── RecipeGrid.tsx            # Card grid with client-side filter/sort state
│   ├── RecipeCard.tsx            # Single card (matches existing .recipe-card HTML)
│   ├── RecipeForm.tsx            # Add/edit form (port existing form HTML to JSX)
│   ├── RecipeOverlay.tsx         # Full-screen overlay modal
│   ├── SearchControls.tsx        # Search, category, sort, favorites bar
│   ├── PhotoUpload.tsx           # File → POST /api/upload → URL (no base64)
│   └── UpdateToast.tsx           # "New version available" PWA banner
├── lib/
│   ├── supabase/client.ts        # createBrowserClient()
│   ├── supabase/server.ts        # createServerClient() for route handlers
│   ├── types.ts                  # Recipe interface (matches DB columns)
│   ├── api.ts                    # Client fetch wrappers (getRecipes, etc.)
│   └── utils.ts                  # Ported helpers from app.js
├── middleware.ts                 # Protect all routes except /login
├── public/
│   ├── manifest.webmanifest      # Copied, start_url updated to "/"
│   ├── service-worker.js         # Updated: skip caching /api/* routes
│   └── icons/                    # icon-192.svg, icon-512.svg (copied)
├── styles/globals.css            # styles.css copied verbatim
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

### API design

**GET /api/recipes** — query params: `search`, `category`, `sort` (`newest`|`az`|`favorites`), `favoritesOnly`
Returns `{ recipes: Recipe[], total: number, favorites: number }`

**POST /api/recipes** — body: `{ name, category, tags, ingredients, instructions, notes, photo_url?, favorite? }`
Returns `{ recipe: Recipe }` with 201

**PUT /api/recipes/[id]** — body: partial Recipe fields
Returns `{ recipe: Recipe }`

**DELETE /api/recipes/[id]** — also deletes photo from Supabase Storage
Returns 204

**PATCH /api/recipes/[id]/favorite** — body: `{ favorite: boolean }`
Returns `{ id, favorite }`

**POST /api/upload** — multipart/form-data with `photo` File field (max 5 MB)
Returns `{ url: string }` — the public Supabase Storage CDN URL

**POST /api/migrate** — body: `{ recipes: OldRecipe[] }` (raw localStorage array)
Upserts all recipes by `id`. For each with a base64 `photo`, uploads to Storage and stores the CDN URL.
Returns `{ imported: number, skipped: number, errors: string[] }`
Guard with `process.env.MIGRATION_ENABLED === 'true'`

---

### Auth flow

`middleware.ts` uses `@supabase/ssr` to check the session cookie on every request. If no session and path is not `/login`, redirect to `/login`. The login page calls `supabase.auth.signInWithPassword()`. Session is stored in an HttpOnly cookie managed by `@supabase/ssr`.

---

### Preserving the UI

**Critical:** The visual design must match the existing app exactly. Use the same:
- CSS variables (`--color-bg`, `--color-accent`, `--font-serif`, etc.)
- Class names from `styles.css` (`.recipe-card`, `.form-section`, `.overlay`, etc.)
- Same form field layout (2-column: form left, grid right, stacks below 980px)
- Same category chips, tag badges, favorite star toggle (★/☆)
- Same full-page overlay modal behavior on card click
- Warm cream background (`#fef8ef`), teal accent (`#1f8a5b`)

---

### Service worker update

In `public/service-worker.js`, the fetch handler must skip caching for API routes:
```javascript
self.addEventListener('fetch', (event) => {
  // Never cache API routes
  if (event.request.url.includes('/api/')) return;
  // ... existing cache-first logic for other routes
});
```

Also update the cached asset list from the old filenames to Next.js static paths.

---

### Migration UX

The `/migrate` page:
1. Shows a `<textarea>` with placeholder "Paste your localStorage JSON here"
2. Instructions: "Open your old browser, run `JSON.stringify(JSON.parse(localStorage.getItem('recipe-vault-v1')))` in the console, paste the result here"
3. Submit button calls `POST /api/migrate`
4. Shows success/error count after

---

### Implementation order

1. Bootstrap Next.js app in the existing `/Users/jkim/Repos/recipe-app` directory (replace the vanilla files)
2. Port CSS and public assets
3. Supabase client setup + middleware + login page
4. All API routes
5. All UI components (RecipeForm → RecipeCard → RecipeGrid → RecipeOverlay → SearchControls → PhotoUpload)
6. Assemble `app/page.tsx`
7. Migration route and page
8. Service worker update
9. End-to-end local test: add recipe, upload photo, edit, delete, toggle favorite, search/filter
10. Deploy: `vercel --prod` with env vars set
11. Instruct user to: run migration from old device, verify, then set `MIGRATION_ENABLED=false` and redeploy

---

### Packages to install

```bash
npm install @supabase/supabase-js @supabase/ssr
```

No other dependencies needed. Do not add Tailwind, Prisma, tRPC, Redux, or any component library.

---

### Verification checklist

After implementation, verify:
- [ ] `npm run dev` starts without errors
- [ ] Visiting `/` without a session redirects to `/login`
- [ ] Login with valid credentials sets session and redirects to `/`
- [ ] Add a recipe via the form → appears in the grid
- [ ] Upload a photo → displayed on card and in overlay (CDN URL, not base64)
- [ ] Edit a recipe → changes persist
- [ ] Delete a recipe → removed from grid, photo deleted from Storage
- [ ] Toggle favorite → star state persists, filter works
- [ ] Search + category filter + sort all work
- [ ] Click a card → overlay opens with full recipe
- [ ] App is installable as PWA (manifest loads, service worker registers)
- [ ] `vercel --prod` deploys successfully
- [ ] Live URL loads, auth works, all CRUD works on production
- [ ] `/migrate` accepts pasted JSON and imports recipes with photos

---

### Notes for the executing agent

- **Read all existing files first** before writing anything. The existing `app.js` is the source of truth for all behavior.
- **Do not recreate the Supabase project or users** — the user will do that manually and provide env vars. You set up all code assuming the env vars exist.
- **Do not commit `.env.local`** — add it to `.gitignore` if not already there.
- **Replace** the existing vanilla JS files with the Next.js project (same directory, new files).
- **Keep the `.git` directory** — commit as you go with meaningful commit messages.
- **Prefer editing existing files** over creating unnecessary new ones.
- After deployment, output the live Vercel URL and the migration instructions for the user.
