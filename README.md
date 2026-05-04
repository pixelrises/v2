# Pixelrises V1

Pixelrises est un SaaS orienté résultats qui permet de créer, optimiser et publier un site business grâce à Pixelrises AI.

Le produit couvre aujourd'hui :
- authentification utilisateur
- génération de site business
- optimisation de site existant
- preview et publication
- gestion de crédits
- dashboard client
- espace admin
- paiements Stripe
- backend Supabase Functions

## Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Stripe
- Gemini via Supabase Edge Functions

## Installation

Prérequis :
- Node.js 18+
- npm
- projet Supabase configuré
- compte Stripe pour les paiements

```bash
npm install
```

## Configuration environnement

Crée un fichier `.env` à partir de `.env.example`.

### Variables frontend

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

### Variables backend Supabase Edge Functions

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_ALLOWED_EMAILS=
GEMINI_API_KEY=
LOVABLE_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Lancement local

```bash
npm run dev
```

Ou avec le script local du workspace :

```powershell
.\start-dev.cmd
```

## Build production

```bash
npm run build
```

## Tests

```bash
npm run test
```

Smoke test du générateur :

```bash
npm run smoke:generator
```

## Déploiement Vercel

1. Push le repo sur GitHub.
2. Importe le repo dans Vercel.
3. Ajoute les variables frontend :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Lance le déploiement.

Le fichier `vercel.json` gère le fallback SPA vers `index.html`.

## Setup Supabase

1. Crée ou relie le projet Supabase.
2. Pousse les migrations dans `supabase/migrations`.
3. Déploie les Edge Functions :
   - `generate-site`
   - `analyze-url`
   - `create-checkout`
   - `stripe-webhook`
   - `grant-dashboard-credits`
   - `bootstrap-admin` si besoin d'auto-promotion admin
4. Configure les secrets backend côté Supabase.

## Setup Stripe

1. Crée les produits et prix Stripe utilisés par Pixelrises.
2. Configure la redirection succès/annulation.
3. Pointe le webhook Stripe vers :

```txt
https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhook
```

4. Ajoute le secret webhook dans `STRIPE_WEBHOOK_SECRET`.
5. Vérifie que les crédits sont bien ajoutés après validation du paiement.

## SEO

Le projet inclut déjà :
- `robots.txt`
- `sitemap.xml`
- meta title / description / OG / Twitter
- JSON-LD dans `index.html`
- `SEOHead` pour les pages clés
- `noindex` sur les pages internes sensibles

## Publication GitHub

Checklist rapide :
1. Vérifier que `.env` n'est pas commité.
2. Vérifier que `node_modules` et `dist` restent ignorés.
3. Committer les changements.
4. Pousser sur GitHub.
5. Importer le repo dans Vercel.

Checklist de lancement détaillée :

- `CHECKLIST_LANCEMENT_V1.md`

## Structure utile

- `src/` : frontend React
- `public/` : assets publics, `robots.txt`, `sitemap.xml`, manifest
- `supabase/functions/` : logique backend serverless
- `supabase/migrations/` : base de données
- `scripts/` : scripts de vérification
- `docs/` : prompts et documentation interne

## Notes de lancement

- aucun accès admin n'est hardcodé
- les secrets doivent rester côté env uniquement
- les pages internes (`/admin`, `/dashboard`, `/auth`) sont non indexables
- les sites générés gardent leur propre rendu, séparé de l'interface Pixelrises
