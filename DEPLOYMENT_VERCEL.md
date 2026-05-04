# Déploiement Pixelrises sur Vercel

## Frontend Vercel

Pixelrises est une SPA Vite.
Le fichier [vercel.json](C:\Users\rkf\Documents\New project\pixelrises-export\vercel.json) gère déjà la réécriture vers `index.html`.

### Variables à définir sur Vercel

Variables frontend uniquement :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Ne pas mettre sur Vercel :

- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ALLOWED_EMAILS`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Ces secrets restent côté Supabase Edge Functions.

## Supabase avant mise en ligne

À pousser sur le projet Supabase :

- les migrations SQL
- la function `generate-site`
- la function `analyze-url`
- la function `create-checkout`
- la function `stripe-webhook`
- la function `grant-dashboard-credits` si elle reste utilisée dans le flow final

### Variables à définir côté Supabase

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Configuration Auth à respecter

Dans Supabase Auth :

- `Site URL` = `https://pixelrises.fr`
- `Redirect URL` app = `https://pixelrises.fr/auth/callback`
- `Redirect URL` provider custom auth = `https://auth.pixelrises.fr/auth/v1/callback`
- `Redirect URL` provider historique = `https://hxbbktdqrswnuarbzhsl.supabase.co/auth/v1/callback`

Le frontend est aligné ainsi :

- en local : le callback reste sur l'origine locale pour ne pas casser les tests
- en prod : le callback app est forcé sur `https://pixelrises.fr/auth/callback`

## Monitoring minimum en production

À vérifier avant d'annoncer le lancement :

- logs frontend actifs pour `window.onerror`
- logs frontend actifs pour `unhandledrejection`
- error boundary visible si le rendu React casse
- logs backend lisibles pour :
  - `generate-site`
  - `create-checkout`
  - `stripe-webhook`
- erreurs auth / paiement / génération traçables avec contexte

## Garde-fous UX obligatoires

- aucun écran blanc
- aucun loading infini
- message clair si auth échoue
- message clair si paiement échoue
- message clair si génération échoue
- retry possible sur les flows critiques

## Générateur : comportement attendu

- 3 crédits pour la création
- 5 crédits pour l'optimisation
- si la génération échoue : pas de débit
- si la réponse AI est partielle : normalisation backend avant affichage
- aucun site cassé ne doit être montré au client

## Ordre recommandé

1. pousser les migrations Supabase
2. déployer les Edge Functions Supabase
3. vérifier le webhook Stripe
4. déployer le frontend sur Vercel
5. tester :
   - auth
   - création
   - optimisation
   - preview
   - publication
   - recharge crédits

### Auth premium

Le projet est prêt pour une bascule vers :

- `auth.pixelrises.fr`

Guide associé :

- `AUTH_DOMAIN_PIXELRISES.md`

## Prêt à lancer ce soir

Le projet peut être considéré comme prêt à lancer quand tout ceci est validé :

- build Vite OK
- tests Vitest OK
- dashboard utilisable
- admin protégé par rôles
- bootstrap admin lié au bon email Google
- génération crédible
- optimisation à 5 crédits fonctionnelle
- analytics visibles
- inscription gratuite bien réglée à `5 crédits`
- aucune mention visible de fournisseur IA
- preview et publication fonctionnelles sur domaine public
- crédits automatiques après paiement vérifiés

## Smoke test de lancement public

Vérifier en production, dans cet ordre :

1. inscription / connexion
2. affichage des crédits sur le dashboard
3. création d'un site depuis `/ai`
4. ouverture de la preview
5. optimisation payante à `5 crédits`
6. publication sur slug Pixelrises
7. ouverture du lien public
8. recharge crédits via Stripe
9. retour `payment-success`
10. crédit automatique après webhook
11. affichage analytics et états vides propres

## Derniers points de vigilance

- ne jamais exposer de secret Stripe ou Supabase côté frontend
- ne jamais hardcoder un accès admin
- ne pas annoncer le lancement comme terminé tant que :
  - les migrations distantes ne sont pas poussées
  - `generate-site` n'est pas déployée
  - `bootstrap-admin` n'est pas déployée
  - `ADMIN_ALLOWED_EMAILS` n'est pas réglée

## Smoke test du générateur

Le script [scripts/smoke-generate-site.mjs](C:\Users\rkf\Documents\New project\pixelrises-export\scripts\smoke-generate-site.mjs) permet de vérifier 4 cas réels : restaurant, coach, immobilier et service local.

Variables nécessaires avant exécution :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `PIXELRISES_SMOKE_BEARER_TOKEN`

Commande :

```bash
npm run smoke:generator
```
