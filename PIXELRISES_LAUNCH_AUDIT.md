# Pixelrises Launch Audit

Document derive du document maitre Pixelrises partage le 23 avril 2026.
Ce fichier sert de checklist operationnelle pour transformer l'existant en produit lancable.

## North Star

Pixelrises ne vend pas un simple site.
Pixelrises vend un resultat business:

- plus de clients
- plus de leads
- plus de credibilite
- plus de rapidite de lancement

Le produit doit toujours garder 2 chemins visibles:

- creer avec l'IA
- deleguer a un professionnel

Le flow utilisateur ideal doit rester conversion-first:

1. le visiteur arrive
2. il est impressionne immediatement
3. il comprend qu'il peut generer un site adapte a son activite
4. il teste
5. il voit un resultat concret
6. il comprend la valeur
7. il est pousse vers l'action

## Etat Actuel

### Base technique

- Stack actuelle: `Vite + React + React Router + Supabase + Stripe`
- Cible long terme du document maitre: `v0 / Next.js + Vercel + Supabase + Stripe + Gemini`
- Conclusion: le projet est avancé en UX, mais il n'est pas encore aligné sur la cible infra finale.

### Ce qui existe deja

- Homepage riche avec hero, demo, portfolio, avant/apres, pricing, avis, CTA
- Page IA complexe avec flow de generation, credits, preview, regeneration
- Dashboard utilisateur deja present
- Dashboard admin deja present
- Tables Supabase deja presentes pour profils, credits, sites, roles, leads, stripe events
- Edge functions deja presentes pour generation IA, diagnostic URL, checkout Stripe, webhook Stripe
- Provider IA deja prepare avec priorite a `GEMINI_API_KEY`

### Ce qui marche deja

- `vite build` passe
- `vitest` passe
- les routes principales existent
- la logique metier principale est visible dans le code
- Stripe est deja branche cote frontend et backend
- le noyau de credits existe

### Ce qui bloque encore le lancement

- `.env` local contient encore des placeholders `VITE_SUPABASE_*`
- le projet live depend encore d'une configuration env incomplete
- le flux OAuth Lovable etait un point de casse important
- le repo local n'est pas encore totalement pousse
- le lint echoue massivement
- plusieurs contenus restent incoherents avec le document maitre
- la stack actuelle n'est pas encore migree vers la cible `Next.js/v0`

## Checklist Priorisee

### P0 - Bloqueurs de lancement

- [ ] pousser les 3 commits locaux vers GitHub
- [ ] choisir la vraie source de verite technique:
  - projet `v0 / Next.js`
  - ou ancienne base `Vite`
- [ ] figer un seul repo principal, un seul projet Vercel, un seul projet Supabase
- [ ] renseigner les vraies variables frontend:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] renseigner les secrets backend:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `GEMINI_API_KEY`
- [ ] verifier que le webhook Stripe credite bien les comptes en production
- [ ] verifier que l'auth email fonctionne de bout en bout
- [ ] verifier les routes protegees `/dashboard` et `/admin`

### P1 - Stabilisation produit

- [ ] supprimer proprement toute dependance fonctionnelle a Lovable
- [ ] finir la stabilisation auth/sessions Supabase
- [ ] corriger les erreurs de lint critiques
- [ ] rendre les messages d'erreur user-friendly sur auth, IA, checkout, credits
- [ ] garder la V1 simple mais fiable, sans chercher la perfection visuelle d'abord
- [ ] verrouiller le flow credits:
  - generation
  - regeneration
  - diagnostic avance
  - publication
  - export
  - recharge
  - abonnement
- [ ] valider le flow complet:
  - signup
  - login
  - achat
  - credits
  - generation
  - preview
  - publication

### P2 - Alignement avec le document maitre

- [ ] remplacer les contenus encore faux ou incoherents
- [ ] corriger la preuve sociale pour correspondre a:
  - `4.9`
  - `8 avis Google verifies`
  - `+30 sites crees`
- [ ] corriger le lien avis Google pour correspondre au document maitre
- [ ] limiter les reseaux sociaux a:
  - TikTok
  - Snapchat
- [ ] verifier que le portfolio montre bien de vraies captures des vrais sites
- [ ] verifier que la demo visible pointe bien vers `https://demo.pixelrises.fr/`
- [ ] verifier que le produit montre un resultat concret tres vite apres l'entree utilisateur
- [ ] garder les 2 chemins clairs partout:
  - IA
  - delegation
- [ ] aligner les packs credits du dashboard avec la regle du document:
  - `1 generation = 3 credits`
  - `Starter = 10 credits`
  - `Pro = 25 credits`
  - `Business = 60 credits`

### P3 - Dashboard utilisateur

- [ ] finaliser un dashboard simple avec 3 blocs principaux:
  - projets
  - credits
  - generation
- [ ] clarifier les statuts de site:
  - draft
  - generated
  - published
  - archived
- [ ] fiabiliser preview/publication/custom domain
- [ ] fiabiliser export HTML ou l'assumer comme feature secondaire
- [ ] ajouter une vue claire pour abonnement et credits
- [ ] rendre les actions principales ultra simples:
  - creer
  - preview
  - publier
  - supprimer
  - recharger
- [ ] rendre chaque site:
  - previsualisable
  - publiable
  - exportable

### P4 - Dashboard admin

- [ ] verifier que les donnees critiques business sont toutes visibles:
  - utilisateurs
  - credits
  - abonnements
  - sites generes
  - paiements
  - leads delegation
  - chiffre d'affaires
- [ ] ajouter ou verifier:
  - formule achetee
  - statut abonnement
  - nombre de generations
  - coordonnees leads
  - dates utiles
- [ ] clarifier les actions admin a forte valeur:
  - ajuster credits
  - suivre commandes
  - traiter leads

### P5 - IA / Diagnostic

- [ ] confirmer que Gemini est le seul provider actif en V1
- [ ] garder les autres IA comme "bientot" si elles restent visibles
- [ ] verifier que la generation produit toujours:
  - hero oriente resultat
  - structure de page logique
  - CTA utiles
  - copywriting non generique
  - base SEO
- [ ] verifier que la sortie est bien:
  - previewable
  - publiable
  - modifiable ensuite dans le dashboard
- [ ] verifier que le diagnostic sort de vraies recommandations actionnables
- [ ] relier proprement diagnostic -> offre IA ou delegation
- [ ] garder le diagnostic comme outil de conversion et de qualification, pas juste un gadget

### P6 - UX / Responsive / Lancement

- [ ] audit mobile complet sur:
  - homepage
  - auth
  - dashboard
  - admin
  - IA
  - modales
  - pricing
- [ ] corriger tous les debordements, textes coupes, CTA hors ecran
- [ ] nettoyer les details de polish et les warnings build secondaires
- [ ] preparer une checklist de lancement production
- [ ] prioriser desktop propre + mobile impeccable

## Flux V1 a respecter

### Flow IA

1. visiteur arrive
2. comprend qu'il peut generer un site pour son activite
3. remplit le formulaire
4. Gemini genere un resultat structure
5. le resultat est sauvegarde
6. l'utilisateur peut preview
7. l'utilisateur peut publier ou modifier
8. l'utilisateur est pousse vers credits / upgrade / delegation

### Flow delegation

1. utilisateur passe par le diagnostic
2. une offre recommandee ressort
3. deux sorties:
   - paiement direct
   - contact / discussion
4. apres paiement:
   - formulaire obligatoire
   - collecte d'infos client

### Flow credits

- les credits doivent servir a:
  - generer
  - regenerer
  - diagnostic avance
  - publier
  - exporter
- le systeme doit rester simple et comprehensible

## Ecarts Constates

### Ecarts produit/business

- La homepage est deja ambitieuse, mais l'ordre et le poids des blocs ne suivent pas encore parfaitement la structure imposee par le document maitre.
- Le quiz/onboarding existe surtout sous forme de module de recommandation, mais pas encore comme veritable experience d'entree ultra memorisable.
- La partie "deleguer a un professionnel" existe, mais peut encore etre mieux mise en avant comme offre premium forte.

### Ecarts contenu

- Le lien Google Reviews visible dans le code n'est pas strictement le meme que celui du document maitre.
- Des liens WhatsApp utilisent encore des variantes historiques.
- Le footer et la section sociale montrent encore YouTube, alors que le document maitre dit "pas Instagram" et met surtout l'accent sur TikTok + Snapchat.

### Ecarts infra

- Le document maitre cible `Next.js/v0`, mais l'app est encore en `Vite`.
- Le preview v0 n'est donc pas le meilleur chemin court terme pour stabiliser le produit.

### Ecarts qualite

- `eslint` echoue avec beaucoup d'erreurs, surtout:
  - `no-explicit-any`
  - `no-empty`
  - `no-empty-object-type`
  - hooks dependencies
- Les tests actuels existent mais ne couvrent quasiment rien du produit reel.

## Recommendation Strategique

Court terme:

1. lancer Pixelrises sur la base Vite actuelle
2. stabiliser auth + Supabase + Stripe + credits + generation
3. corriger les incoherences business visibles
4. auditer le responsive

Moyen terme:

1. finaliser le dashboard user/admin
2. fiabiliser publication et domaines
3. renforcer quiz/diagnostic/onboarding

Long terme:

1. migrer proprement vers une architecture Next.js si elle devient vraiment necessaire
2. ne pas bloquer le lancement a cause de cette migration

Si la version `v0 / Next.js` est maintenant la bonne base reelle et qu'elle est reliee a Supabase correctement, alors cette recommandation doit etre adaptee:

1. figer `v0 / Next.js` comme source de verite
2. reproduire cette checklist sur cette base
3. ne plus investir lourdement dans l'ancien socle `Vite`

## Prochaine Tranche Recommandee

Sprint 1:

- auth Supabase
- variables d'environnement
- webhook Stripe
- credits fiables
- push GitHub / redeploy

Sprint 2:

- dashboard user
- dashboard admin
- alignement offres et preuves sociales

Sprint 3:

- diagnostic utile
- onboarding/quiz plus fort
- polish responsive final

