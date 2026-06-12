# Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste `supabase-schema.sql`, and run it.
   - For an existing project created before workout time support, run
     `supabase-add-workout-time.sql` once.
3. Open **Project Settings > API** and copy:
   - Project URL
   - Publishable key (or legacy `anon` key)
4. Replace the placeholders in `supabase-config.js`.
5. Open **Authentication > URL Configuration** and set:
   - Site URL: `https://lailai950310-rgb.github.io/codex-/`
   - Redirect URL: `https://lailai950310-rgb.github.io/codex-/`
6. In **Authentication > Providers > Email**, keep Email enabled.

Never put the `service_role` key in this repository. GitHub Pages is public,
so access control must rely on the Row Level Security policies in
`supabase-schema.sql`.
