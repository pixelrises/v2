# Pixelrises V2 - GitHub QA Secrets

Repository cible: `pixelrises/v2`.

Cette QA utilise un compte test dedie et peut consommer des credits. Ne jamais utiliser le compte admin principal, un compte client reel, ni un mot de passe partage dans un chat.

## Secrets GitHub Actions

Ajouter dans `Settings -> Secrets and variables -> Actions -> Secrets`:

- `PIXELRISES_SMOKE_EMAIL`
- `PIXELRISES_SMOKE_PASSWORD`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Important: si un mot de passe a ete envoye dans une conversation, il doit etre change avant d'etre mis dans GitHub Secrets.

## Variables GitHub Actions

Ajouter dans `Settings -> Secrets and variables -> Actions -> Variables`:

- `PIXELRISES_GENERATOR_REAL_QA=1`
- `PIXELRISES_GENERATOR_DAILY_REAL_BUDGET=3`

## Workflow

Le workflow V2 est `.github/workflows/generator-real-qa.yml`.

Il lance:

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run smoke:generator`

Le smoke reel ne s'execute que si `PIXELRISES_GENERATOR_REAL_QA=1`.
Le budget quotidien limite le nombre de generations reelles.

## Garde-fous

- Aucun secret n'est ecrit dans le repo.
- Aucun mot de passe n'est loggue.
- Aucun deploiement production n'est lance.
- Les tests statiques passent avant toute consommation de credits.
- Le rapport est publie en artifact: `tmp/generator-smoke-last.json`.
