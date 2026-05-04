# GitHub Import

`git` n'est pas disponible sur cette machine actuellement, donc le chemin le plus simple est :

1. creer un nouveau repo GitHub vide
2. envoyer l'archive propre dans le repo via l'interface web
3. importer ensuite ce repo dans v0

## Archive a utiliser

- `C:\Users\rkf\Documents\New project\pixelrises-export-github-ready.zip`

## Variables a configurer ensuite

Dans v0 / Vercel :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Dans Supabase secrets :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Important

- ne pas uploader `.env`
- ne pas exposer `GEMINI_API_KEY` dans le frontend
- garder Gemini cote Supabase Edge Functions

