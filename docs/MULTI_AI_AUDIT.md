# Pixelrises V2 Multi-IA Audit

Date: 2026-05-03
Dossier officiel: `C:\Users\rkf\Desktop\pixelrises v2`

## A. Resume clair

La base Multi-IA de Pixelrises V2 est en place dans `src/modules/ai`. Elle prepare un pipeline complet:

User Prompt -> AI Orchestrator -> Prompt Splitter -> Task Router -> Provider Adapter -> Output Normalizer -> Quality Gate -> Fusion Engine -> Final Pixelrises Output.

Les providers sont prepares en mode mock-safe. Aucun appel reel a une API externe n'est effectue depuis le frontend.

## B. Ce qui est deja fait

- AI Orchestrator fonctionnel.
- Prompt Splitter pour site, agent, game, integration, improvement, code, strategy et template.
- Task Router centralise via `ai-routing.config.ts`.
- Provider adapters: Gemini, OpenAI, Claude, Claude Design, Claude Code, Mistral, Mock, Future.
- Mock Provider fonctionnel pour developpement local et tests.
- Output Normalizer pour site, agent, game et sorties generiques.
- Fusion Engine pour site, agent, game et recommandations generiques.
- Validation Layer / Quality Gate avec detection de secrets.
- CostControl et UsageLogger.
- Security redaction via `redactSecrets`.
- Prompts systeme separes par role IA.
- AI Settings UI dans `/settings`.
- Site Builder, Agent Builder et Game Builder branchent l'orchestrator en mock-safe.
- `.env.example` documente les variables IA sans vraie cle.
- Tests unitaires Multi-IA ajoutes.

## C. Ce qui manque

- Routes backend / edge functions securisees pour appels reels.
- Connexion reelle aux providers OpenAI, Gemini, Claude/Anthropic et Mistral.
- Structured outputs reels par provider.
- Streaming reel par provider.
- Observabilite serveur et suivi cout reel.
- Mode avance UI pour voir tout le routing.
- Persistance backend des logs usage.

## D. Ce qui est dangereux

- Exposer une cle API dans le frontend serait dangereux et reste interdit.
- Connecter un provider reel sans route backend securisee casserait la regle de securite.
- Les providers specialises sont actuellement des adapters mock; il ne faut pas les presenter comme connectes.
- `git status` montre tout le projet comme untracked, donc il ne permet pas de separer finement l'historique local.

## E. Ce qui est mocke

- Gemini / Pixelrises AI General.
- OpenAI / Pixelrises Strategy.
- Claude / Pixelrises Logic.
- Claude Design.
- Claude Code.
- Mistral.
- Outputs de site, agent, game et recommandations.
- Test connexion dans Settings.

## F. Ce qui doit etre branche avec API

- Backend Gemini via `GEMINI_API_KEY` ou `GOOGLE_API_KEY`.
- Backend OpenAI via `OPENAI_API_KEY`.
- Backend Claude/Anthropic via `ANTHROPIC_API_KEY` ou `CLAUDE_API_KEY`.
- Backend Mistral via `MISTRAL_API_KEY`.
- Timeout, retry, logging serveur et couts reels.

## G. Prochaines etapes recommandees

Critique:
- Creer une route backend unique `/api/ai/orchestrate` ou edge function equivalente.
- Deplacer les appels reels providers cote serveur uniquement.
- Ajouter tests contre la route backend avec mock server.

Important:
- Ajouter mode avance UI pour afficher task -> provider -> fallback.
- Ajouter persistance usage logs.
- Ajouter schemas Zod pour les sorties provider.

Amelioration:
- Nettoyer les anciens textes mojibake restants dans certaines pages V2.
- Ajouter snapshots visuels responsive.
- Ajouter un panneau debug interne reserve admin.

Plus tard:
- Streaming Multi-IA.
- Controle cout reel par utilisateur.
- Provider image et voice generation.

## H. Fichiers crees/modifies

Fichiers crees:
- `src/modules/ai/config/ai-modes.config.ts`
- `src/modules/ai/config/ai-providers.config.ts`
- `src/modules/ai/config/ai-routing.config.ts`
- `src/modules/ai/orchestrator/AIOrchestrator.ts`
- `src/modules/ai/orchestrator/FusionEngine.ts`
- `src/modules/ai/orchestrator/OutputNormalizer.ts`
- `src/modules/ai/orchestrator/PromptSplitter.ts`
- `src/modules/ai/orchestrator/TaskRouter.ts`
- `src/modules/ai/orchestrator/ValidationLayer.ts`
- `src/modules/ai/orchestrator/index.ts`
- `src/modules/ai/prompts/claude.logic.prompt.ts`
- `src/modules/ai/prompts/cloud-code.prompt.ts`
- `src/modules/ai/prompts/cloud-design.prompt.ts`
- `src/modules/ai/prompts/gemini.system.prompt.ts`
- `src/modules/ai/prompts/mistral.fast.prompt.ts`
- `src/modules/ai/prompts/openai.copywriting.prompt.ts`
- `src/modules/ai/prompts/openai.strategy.prompt.ts`
- `src/modules/ai/providers/BaseProviderAdapter.ts`
- `src/modules/ai/providers/ClaudeProviderAdapter.ts`
- `src/modules/ai/providers/ClaudeCodeProviderAdapter.ts`
- `src/modules/ai/providers/ClaudeDesignProviderAdapter.ts`
- `src/modules/ai/providers/FutureProviderAdapter.ts`
- `src/modules/ai/providers/GeminiProviderAdapter.ts`
- `src/modules/ai/providers/MistralProviderAdapter.ts`
- `src/modules/ai/providers/MockProviderAdapter.ts`
- `src/modules/ai/providers/OpenAIProviderAdapter.ts`
- `src/modules/ai/providers/index.ts`
- `src/modules/ai/schemas/agent-output.schema.ts`
- `src/modules/ai/schemas/ai-output.schema.ts`
- `src/modules/ai/schemas/ai-task.schema.ts`
- `src/modules/ai/schemas/game-output.schema.ts`
- `src/modules/ai/schemas/site-output.schema.ts`
- `src/modules/ai/security/redactSecrets.ts`
- `src/modules/ai/security/validateServerOnly.ts`
- `src/modules/ai/usage/CostControl.ts`
- `src/modules/ai/usage/UsageLogger.ts`
- `src/modules/ai/tests/ai-orchestrator.test.ts`
- `src/modules/ai/tests/cost-usage.test.ts`
- `src/modules/ai/tests/mock-provider.test.ts`
- `src/modules/ai/tests/output-normalizer.test.ts`
- `src/modules/ai/tests/routing-config.test.ts`
- `src/modules/ai/tests/task-router.test.ts`
- `src/modules/ai/tests/validation-layer.test.ts`
- `docs/MULTI_AI_AUDIT.md`

Fichiers modifies:
- `.env.example`
- `src/modules/ai/index.ts`
- `src/pages/Settings.tsx`
- `src/pages/SiteBuilder.tsx`
- `src/pages/AgentBuilder.tsx`
- `src/pages/GameBuilder.tsx`

## I. Resultat des tests

- `vitest run src/modules/ai/tests`: 7 fichiers, 18 tests, OK.
- `vitest run`: 15 fichiers, 32 tests, OK.
- `vite build`: OK.

Notes:
- Deux warnings React Router Future Flag sont emis par les tests existants. Ils ne bloquent pas.

## J. Confirmation V1

Aucun fichier V1 n'a ete modifie. Toutes les modifications ont ete effectuees dans le dossier officiel V2:

`C:\Users\rkf\Desktop\pixelrises v2`
