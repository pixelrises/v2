# Transfer to v0

## Ce qui est pret

- Le frontend peut rester tel quel en `Vite + React`.
- Le generateur de site continue de passer par `Supabase Edge Functions`.
- Les fonctions IA acceptent maintenant :
  - `GEMINI_API_KEY` en priorite
  - `LOVABLE_API_KEY` en fallback

## Important

Le secret Gemini ne doit pas etre mis dans le frontend ni expose au navigateur.

- `v0 / Vercel` : variables frontend uniquement
- `Supabase` : secrets backend pour les Edge Functions

## Variables a mettre dans v0 / Vercel

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Secrets a mettre dans Supabase

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

`LOVABLE_API_KEY` est optionnel si tu veux garder le fallback historique.

## Commande Supabase utile

```powershell
supabase secrets set GEMINI_API_KEY=ta_cle_ici
```

## Chemin recommande pour v0

1. Pousser ce dossier sur GitHub.
2. Importer le repo dans v0 comme projet existant.
3. Ajouter les variables frontend dans le projet v0 / Vercel.
4. Deployer.
5. Garder les fonctions `generate-site` et `analyze-url` sur Supabase avec `GEMINI_API_KEY`.

## References

- v0 peut demarrer depuis un repo, des fichiers, ou une archive zip d'apres la doc officielle.
- La doc Gemini recommande de stocker `GEMINI_API_KEY` en variable d'environnement cote serveur.

