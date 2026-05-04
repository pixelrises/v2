# Checklist Lancement Pixelrises V1

Cette checklist sert de référence unique pour lancer Pixelrises V1 proprement, sans oublier les points critiques.

## 1. Produit

Valider que ces flows fonctionnent en live :

- [ ] inscription / connexion Google
- [ ] dashboard chargé correctement
- [ ] crédits visibles dès l'arrivée
- [ ] création de site depuis `/ai`
- [ ] preview du site ouverte sans erreur
- [ ] optimisation payante à `5 crédits`
- [ ] publication du site
- [ ] ouverture du lien public du site publié
- [ ] espace admin accessible seulement aux comptes autorisés
- [ ] ajout / retrait de crédits depuis l'admin

## 2. Google Auth

Vérifier ces réglages dans Supabase et Google Cloud :

- [ ] `Site URL` Supabase = `https://pixelrises.fr`
- [ ] redirect URL autorisée = `https://pixelrises.fr/auth/callback`
- [ ] redirect URL autorisée = `https://www.pixelrises.fr/auth/callback` si le `www` est utilisé
- [ ] redirect URL Supabase OAuth = `https://hxbbktdqrswnuarbzhsl.supabase.co/auth/v1/callback`
- [ ] domaine `pixelrises.fr` bien autorisé dans la configuration Google OAuth
- [ ] connexion testée depuis navigateur classique desktop
- [ ] connexion testée depuis mobile
- [ ] connexion testée hors navigateur intégré si Google bloque un `disallowed_useragent`

Notes :

- Les navigateurs intégrés peuvent être bloqués par Google.
- Le projet contient déjà un fallback pour rediriger vers le bon navigateur public si besoin.

## 3. Vercel

Vérifier le projet Vercel :

- [ ] repo GitHub connecté au bon projet
- [ ] branche `main` connectée au déploiement de production
- [ ] domaine principal = `pixelrises.fr`
- [ ] redirection `www` -> domaine principal ou inverse, selon ton choix
- [ ] déploiement de production réussi sans erreur
- [ ] build Vercel vert

Variables frontend obligatoires :

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`

Bon rappel :

- Les variables `SUPABASE_*`, `STRIPE_*`, `GEMINI_*` sensibles ne doivent pas être exposées au frontend Vercel.

## 4. Supabase

Vérifier le projet Supabase live :

- [ ] bon projet Supabase utilisé
- [ ] migrations SQL poussées
- [ ] RLS activée là où attendu
- [ ] table `user_roles` présente et fonctionnelle
- [ ] `user_credits` fonctionne
- [ ] `credit_transactions` fonctionne

Edge Functions à déployer :

- [ ] `generate-site`
- [ ] `analyze-url`
- [ ] `create-checkout`
- [ ] `stripe-webhook`
- [ ] `grant-dashboard-credits` si encore utilisé
- [ ] `bootstrap-admin` si tu gardes l'auto-promotion admin par email

Secrets Supabase à vérifier :

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ADMIN_ALLOWED_EMAILS` si `bootstrap-admin` est utilisé
- [ ] `GEMINI_API_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

## 5. Stripe

Vérifier le cycle de paiement :

- [ ] produits et prix Stripe existent
- [ ] checkout ouvre bien
- [ ] retour succès fonctionne
- [ ] retour annulation fonctionne
- [ ] webhook pointe vers la bonne function Supabase
- [ ] crédits ajoutés automatiquement après paiement validé
- [ ] pas de double crédit si webhook rejoue
- [ ] abonnement fonctionne si utilisé
- [ ] recharge ponctuelle fonctionne

Webhook attendu :

- [ ] `https://hxbbktdqrswnuarbzhsl.supabase.co/functions/v1/stripe-webhook`

## 6. Admin

Vérifier :

- [ ] ton compte Google a bien le rôle `admin`
- [ ] seuls les comptes voulus ont ce rôle
- [ ] bouton `Admin` visible seulement pour les admins
- [ ] crédits modifiables depuis l'admin
- [ ] utilisateurs visibles
- [ ] paiements visibles
- [ ] sites visibles
- [ ] leads visibles si le flow est actif

## 7. Monitoring et erreurs live

Minimum obligatoire en production :

- [ ] erreurs frontend capturées via `window.onerror` et `unhandledrejection`
- [ ] fallback UI visible au lieu d'un écran blanc
- [ ] erreurs auth loggées avec contexte
- [ ] erreurs paiement loggées avec contexte
- [ ] erreurs génération loggées avec contexte
- [ ] logs backend consultables sur `generate-site`
- [ ] logs backend consultables sur `create-checkout`
- [ ] logs backend consultables sur `stripe-webhook`
- [ ] dernier incident reproductible sans devoir deviner

## 8. SEO

Vérifier la partie publique :

- [ ] `title` unique et crédible sur chaque page publique
- [ ] `meta description` propre sur chaque page publique
- [ ] `meta keywords` léger si utilisé
- [ ] Open Graph présent
- [ ] Twitter card présente
- [ ] `robots.txt` disponible
- [ ] `sitemap.xml` disponible
- [ ] pages internes sensibles en `noindex`
- [ ] une seule balise `h1` par page importante
- [ ] liens canoniques cohérents
- [ ] accents et français propres sur les textes publics

Pages à vérifier visuellement :

- [ ] home
- [ ] portfolio
- [ ] auth
- [ ] dashboard
- [ ] admin
- [ ] pages légales

## 9. Design, UX et responsive

Vérifier en mobile, tablette et desktop :

- [ ] pas de texte coupé
- [ ] pas d'overflow horizontal
- [ ] CTA visibles et clairs
- [ ] hero lisible
- [ ] section portfolio fluide
- [ ] section pricing cohérente
- [ ] dashboard lisible sur mobile
- [ ] admin utilisable sur mobile minimum

Protection UX critique :

- [ ] aucun écran blanc visible
- [ ] aucun loading infini
- [ ] chaque échec montre un message compréhensible
- [ ] auth fail = message + retry
- [ ] paiement fail = message + support
- [ ] génération fail = message + retry

## 10. Contenu et textes

Vérifier :

- [ ] plus aucun caractère cassé visible
- [ ] plus de `ï¿½`, `Ã`, `Â`, `â€`
- [ ] aucun placeholder visible
- [ ] aucun texte technique exposé aux clients
- [ ] aucune mention visible de fournisseur IA externe
- [ ] branding unique = `Pixelrises AI`

## 11. Sites générés

Vérifier sur plusieurs cas réels :

- [ ] restaurant
- [ ] coach
- [ ] immobilier
- [ ] service local

Pour chaque génération :

- [ ] JSON valide
- [ ] sections complètes
- [ ] pas de texte générique
- [ ] CTA clairs
- [ ] SEO local cohérent
- [ ] ton crédible
- [ ] rendu différencié selon la niche

Fallback générateur :

- [ ] si la génération échoue, aucun crédit n'est débité
- [ ] si la génération échoue, l'utilisateur peut réessayer
- [ ] si le JSON AI est partiel, la normalisation complète les sections manquantes
- [ ] aucun site cassé n'est affiché

## 12. Liens, redirections et edge cases

Vérifier :

- [ ] aucun lien interne cassé
- [ ] aucun bouton qui renvoie vers une mauvaise route
- [ ] retour login -> bon écran
- [ ] retour paiement -> bon écran
- [ ] preview -> publication -> lien public sans cassure
- [ ] footer -> pages légales OK
- [ ] liens externes ouvrent bien les bonnes URL

Edge cases :

- [ ] utilisateur sans crédits redirigé proprement vers la recharge
- [ ] double clic paiement impossible ou sans double effet
- [ ] refresh pendant génération = pas d'état incohérent
- [ ] logout pendant un flow sensible = retour propre
- [ ] retour paiement annulé = message clair

## 13. Emails et notifications

- [ ] email de confirmation de compte actif via Supabase
- [ ] email de paiement réussi actif via Stripe si attendu
- [ ] email de paiement échoué ou abonnement refusé vérifié si utilisé
- [ ] aucun flow critique ne dépend d'un email qui n'existe pas réellement

## 14. GitHub et package

Vérifier avant de pousser :

- [ ] `.env` non committé
- [ ] `node_modules` ignoré
- [ ] `dist` ignoré
- [ ] README à jour
- [ ] ce fichier de checklist présent
- [ ] branche de production claire

## 15. Vérification technique finale

À lancer :

- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm run test`
- [ ] `npm run smoke:generator`

Si le smoke test du générateur est utilisé :

- [ ] `PIXELRISES_SMOKE_BEARER_TOKEN` renseigné

Performance minimum :

- [ ] pages chargées en lazy
- [ ] images importantes en lazy ou optimisées
- [ ] bundle non anormalement lourd
- [ ] première navigation mobile fluide

## 16. Go / No-Go

Tu peux considérer Pixelrises V1 comme lançable si :

- [ ] le front live charge sans erreur JS
- [ ] la connexion Google fonctionne
- [ ] les crédits s'affichent et se mettent à jour
- [ ] la génération marche en live
- [ ] l'optimisation à `5 crédits` marche
- [ ] la publication marche
- [ ] Stripe ajoute bien les crédits
- [ ] l'admin est réservé aux bons comptes
- [ ] aucun caractère cassé visible
- [ ] le domaine public fonctionne

## 17. Points probablement à vérifier encore

Ces points méritent une vérification finale si ce n'est pas déjà fait :

- [ ] les nouvelles corrections locales ont bien été poussées sur GitHub
- [ ] Vercel a bien redéployé la dernière version
- [ ] `VITE_SUPABASE_URL` est présent sur Vercel
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` est présent sur Vercel
- [ ] Google OAuth a bien toutes les redirections finales de `pixelrises.fr`
- [ ] les derniers hotfix auth / redirections / UTF-8 sont bien en production

## 18. Lancement ce soir

Ordre recommandé :

1. vérifier GitHub et pousser la dernière version
2. vérifier les variables Vercel
3. redéployer le front
4. vérifier Supabase Functions et secrets
5. tester Google Auth
6. tester création + preview + publication
7. tester Stripe + crédits
8. faire un tour mobile final
9. annoncer le lancement
