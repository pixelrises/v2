# Auth Domain Pixelrises

Ce guide prépare une bascule propre de l'authentification vers un domaine premium :

- `auth.pixelrises.fr`

L'objectif est de garder une expérience cohérente avec `pixelrises.fr`, de limiter l'effet `xxxxx.supabase.co` pendant Google OAuth, et de conserver une transition sans casse.

## Sous-domaine retenu

Sous-domaine recommandé :

- `auth.pixelrises.fr`

Le code réserve déjà `auth` comme sous-domaine système, afin qu'il ne soit jamais interprété comme un site publié client.

## Configuration Supabase

Configurer le domaine d'authentification custom dans Supabase avec :

- `auth.pixelrises.fr`

Puis vérifier exactement :

- `Site URL` = `https://pixelrises.fr`
- `Redirect URL` app = `https://pixelrises.fr/auth/callback`
- `Redirect URL` provider custom auth = `https://auth.pixelrises.fr/auth/v1/callback`
- `Redirect URL` provider historique = `https://hxbbktdqrswnuarbzhsl.supabase.co/auth/v1/callback`

Le code frontend est désormais aligné avec cette logique :

- en local : callback = `http://127.0.0.1:4173/auth/callback` ou `http://localhost:4173/auth/callback`
- hors local : callback app forcé = `https://pixelrises.fr/auth/callback`

## DNS

Créer et pointer le sous-domaine :

- `auth.pixelrises.fr`

Suivre ensuite les instructions données par Supabase pour activer le custom auth domain.

## Google OAuth

Dans Google Cloud Console :

- nom de l'application = `Pixelrises`
- domaine autorisé = `pixelrises.fr`
- domaine autorisé additionnel si nécessaire = `auth.pixelrises.fr`

Callbacks à enregistrer :

- `https://auth.pixelrises.fr/auth/v1/callback`
- `https://hxbbktdqrswnuarbzhsl.supabase.co/auth/v1/callback`

## Validation

Tester ensuite :

- login Google desktop
- login Google mobile
- retour vers `/auth/callback`
- redirection vers `/dashboard`
- session persistante
- fallback navigateur intégré toujours fonctionnel

## Fin de transition

Quand tout est validé en production :

- tu peux garder les deux callbacks provider pour la compatibilité
- ou retirer le callback Supabase historique si tu veux une configuration plus propre
