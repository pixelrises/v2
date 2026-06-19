# Pixelrises V2

Pixelrises V2 est la plateforme IA publique de Pixelrises pour creer, structurer, tester et faire evoluer des projets business avec un cockpit unique.

V2 couvre aujourd'hui :
- landing publique Pixelrises ;
- `AI Spaces` avec orientations par usage ;
- `Business AI` pour strategie, offre, landing, conversion et briefs builders ;
- `Student AI` pour revision, fiches, quiz, oral, slides, plan de travail et brouillons pedagogiques ;
- `Site Builder` pour brief, generation, preview, sauvegarde et publication preparee ;
- `Game Builder` pour prototypes et packs beta encadres ;
- `Agent Studio` pour definir, configurer et sauvegarder des agents ;
- `Templates` pour ouvrir les bons espaces avec une demande pre-remplie ;
- `Creator AI`, `Image AI` et `Video AI` via orchestrateur, selon niveau de credits et provider disponible ;
- `Diagnostic` pour orienter vers la bonne offre ;
- `Dashboard`, `Credits`, `Billing`, `Integrations`, `Automations` et `Admin/Product Lab`.

## Positionnement V2

Pixelrises V2 n'est pas V3 ni V4.

V2 est concue pour :
- etre vendable publiquement avec limites honnetes ;
- garder les modules sensibles proteges ;
- distinguer clairement le reel, le prepare, le mock et le bientot ;
- rester evolutive vers V3/V4 sans casser la base.

Restent volontairement limites ou prepares :
- certaines integrations externes ;
- certaines automatisations live ;
- certaines generations premium image/video selon les cles serveur ;
- certaines actions admin ou cloud qui exigent une vraie session Supabase et des variables de prod.

## Architecture produit

### Modules principaux

- `Business AI` : creation, offre, copywriting, conversion, marche, concurrence, briefs builders.
- `Student AI` : cours, revision, fiches, quiz, oral, slides, planning, correction et progression.
- `Site Builder` : generation de site business, preview et iteration.
- `Game Builder` : structure, prototype, scripts et contraintes plateforme.
- `Agent Studio` : role, mission, permissions, test, sauvegarde.
- `Templates` : exemples prets a reprendre qui redirigent vers les bons modules.
- `Product Lab` : espace admin de propositions et d'amelioration continue.

### AI Orchestrator

Pixelrises V2 utilise une logique de routage multi-IA cote serveur.

Roles documentes actuellement dans le code :
- `OpenAI` : strategie, copywriting, SEO, conversion, offre, marketing textuel.
- `Claude` : raisonnement, quality gate, coherence, permissions, planification.
- `Claude Design` : UI/UX, direction artistique, layout, design system.
- `Claude Code` : generation technique, debug, refactor, scripts, review.
- `Gemini` : moteur general, ideation visuelle rapide, fallback valeur.
- `Mistral` : fallback economique, classification, rapidite.
- `Pollojourney` : moteur premium image/video type Midjourney-like via API serveur quand configure.

L'orchestrateur ne doit pas exposer :
- secret ;
- provider key ;
- model id sensible ;
- prompt systeme.

## Credits et niveaux

La logique produit vise quatre niveaux :
- `Lite / Rapide`
- `Standard`
- `Premium`
- `Ultra`

Principe :
- plus le niveau monte, plus le pipeline peut utiliser des briques premium ;
- les credits doivent etre debites apres succes ;
- pas de debit si echec total ;
- si un provider premium n'est pas configure, Pixelrises doit rester honnete et basculer vers un fallback rentable ou vers un statut `A configurer`.

## Integrations techniques

- `Frontend` : React 18, TypeScript, Vite, Tailwind, shadcn/ui.
- `Backend` : Supabase Edge Functions, auth, database et storage.
- `Paiement` : Stripe.
- `Deploy` : Vercel.
- `IA` : Vercel AI Gateway + providers server-side.

## Routes importantes

- `/` : landing publique
- `/auth` : connexion / inscription
- `/dashboard`
- `/builder/site`
- `/builder/game`
- `/builder/agent`
- `/ai-spaces/business`
- `/ai-spaces/student`
- `/templates`
- `/pricing`
- `/diagnostic`
- `/integrations`
- `/automations`
- `/admin`

## Installation locale

Prerequis :
- Node.js 18+
- npm
- projet Supabase configure
- variables d'environnement locales

```bash
npm install
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` ou `.env`.

### Frontend public

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

### Backend / Supabase

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_ALLOWED_EMAILS=
```

### IA / Orchestration

```env
AI_GATEWAY_API_KEY=
VERCEL_AI_GATEWAY_API_KEY=
AI_GATEWAY_MODEL=
AI_GATEWAY_FAST_MODEL=
AI_GATEWAY_BALANCED_MODEL=
AI_GATEWAY_REASONING_MODEL=
AI_GATEWAY_OPENAI_MODEL=
AI_GATEWAY_COPY_MODEL=
AI_GATEWAY_CLAUDE_MODEL=
AI_GATEWAY_DESIGN_MODEL=
AI_GATEWAY_CODE_MODEL=
AI_GATEWAY_GEMINI_MODEL=
AI_GATEWAY_FALLBACK_MODELS=
AI_GATEWAY_ALLOW_PREMIUM_MODELS=
OPENAI_API_KEY=
CLAUDE_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
MISTRAL_API_KEY=
POLLO_API_KEY=
POLLO_API_BASE_URL=
AI_DEFAULT_PROVIDER=
```

### Stripe

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Commandes utiles

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

Autres commandes presentes :
- `npm run product-lab:*`
- `npm run smoke:generator`
- `npm run gateway:*`

## Deploiement

Flux attendu :
1. pousser la branche GitHub ;
2. laisser Vercel builder le projet ;
3. verifier les variables d'environnement ;
4. verifier le domaine public ;
5. confirmer les fonctions Supabase et Stripe cote serveur.

## Statuts produit autorises

Dans l'interface, un module doit afficher un statut honnete :
- `Actif`
- `A configurer`
- `Prepare`
- `Mock`
- `Bientot`

Ne jamais afficher `Actif` si la brique n'est pas reellement branchee.

## Securite

Regles critiques :
- ne jamais exposer `service_role` cote frontend ;
- ne jamais exposer de cle IA cote client ;
- ne jamais commit de secret ;
- ne jamais afficher les cles dans les logs ;
- ne jamais simuler une integration reelle si elle est seulement preparee ;
- garder le bypass local strictement limite a `localhost` / `127.0.0.1` / `::1`.

## Documentation associee

- `docs/V2_FINAL_EXECUTION_REPORT.md`
- pages legales dans `src/pages/`
- documentation interne dans `docs/`

## Limites connues

- certaines validations live dependent encore des dashboards externes ;
- certains providers premium dependent de variables serveur non testables dans tous les environnements ;
- les workflows Product Lab cloud exigent une vraie session admin Supabase / GitHub ;
- la charge multi-utilisateur reelle depend aussi des limites de plan Supabase/Vercel et pas seulement du code.
