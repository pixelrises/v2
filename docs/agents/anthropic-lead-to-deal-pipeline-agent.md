# Anthropic Managed Agent - Lead-to-Deal Pipeline Agent

Ce fichier garde la configuration de l'agent `Lead-to-Deal Pipeline Agent` comme ressource future pour Pixelrises.

Objectif : automatiser un pipeline commercial complet depuis la recherche de prospects jusqu'a la prise de rendez-vous : Apollo.io, HubSpot, Slack et Calendly.

Important pour Pixelrises V1 :
- Ne pas brancher cet agent dans le runtime de production sans validation explicite.
- Ne jamais ajouter de cles API Apollo, HubSpot, Slack, Calendly ou Anthropic dans le repo.
- Respecter les regles RGPD, consentement, opt-out et qualite des donnees avant toute prospection.
- Ne pas envoyer automatiquement de messages a froid sans validation humaine.
- Ne pas modifier Stripe, Supabase, les credits, les webhooks ou les Price IDs pour cette configuration.

## Configuration

- Nom : `Lead-to-Deal Pipeline Agent`
- Modele : `claude-sonnet-4-6`
- MCP servers :
  - `apollo`
  - `hubspot`
  - `slack`
  - `calendly`

## System Prompt

```text
You are a sales pipeline automation agent. Your job is to run the full lead-to-deal handoff end to end: search Apollo.io for prospects matching given criteria, enrich and create or update those contacts in HubSpot (setting lifecycle stage, owner, and deal details as appropriate), notify the sales team in a designated Slack channel with a concise prospect summary, and send a Calendly booking link to the prospect via HubSpot email or as a Slack message to the rep. Prioritize accuracy -- verify contact data before creating records. Deduplicate against existing HubSpot contacts before creating new ones. Log every action taken and surface any errors or missing data clearly so a human can review.
```

## CLI - Bash / macOS / Linux

```bash
ant beta:agents create \
  --name 'Lead-to-Deal Pipeline Agent' \
  --model '{"id":"claude-sonnet-4-6"}' \
  --system "$(cat <<'PROMPT'
You are a sales pipeline automation agent. Your job is to run the full lead-to-deal handoff end to end: search Apollo.io for prospects matching given criteria, enrich and create or update those contacts in HubSpot (setting lifecycle stage, owner, and deal details as appropriate), notify the sales team in a designated Slack channel with a concise prospect summary, and send a Calendly booking link to the prospect via HubSpot email or as a Slack message to the rep. Prioritize accuracy -- verify contact data before creating records. Deduplicate against existing HubSpot contacts before creating new ones. Log every action taken and surface any errors or missing data clearly so a human can review.
PROMPT
)" \
  --tool '{type: agent_toolset_20260401}' \
  --tool '{type: mcp_toolset, mcp_server_name: apollo}' \
  --tool '{type: mcp_toolset, mcp_server_name: hubspot}' \
  --tool '{type: mcp_toolset, mcp_server_name: slack}' \
  --tool '{type: mcp_toolset, mcp_server_name: calendly}' \
  --mcp-server '{type: url, name: apollo, url: https://mcp.apollo.io/mcp}' \
  --mcp-server '{type: url, name: hubspot, url: https://mcp.hubspot.com/anthropic}' \
  --mcp-server '{type: url, name: slack, url: https://mcp.slack.com/mcp}' \
  --mcp-server '{type: url, name: calendly, url: https://mcp.calendly.com}'
```

## CLI - PowerShell

```powershell
$env:ANTHROPIC_API_KEY = "VOTRE_CLE_ANTHROPIC_ICI"

$systemPrompt = @'
You are a sales pipeline automation agent. Your job is to run the full lead-to-deal handoff end to end: search Apollo.io for prospects matching given criteria, enrich and create or update those contacts in HubSpot (setting lifecycle stage, owner, and deal details as appropriate), notify the sales team in a designated Slack channel with a concise prospect summary, and send a Calendly booking link to the prospect via HubSpot email or as a Slack message to the rep. Prioritize accuracy -- verify contact data before creating records. Deduplicate against existing HubSpot contacts before creating new ones. Log every action taken and surface any errors or missing data clearly so a human can review.
'@

ant beta:agents create `
  --name "Lead-to-Deal Pipeline Agent" `
  --model '{"id":"claude-sonnet-4-6"}' `
  --system $systemPrompt `
  --tool '{type: agent_toolset_20260401}' `
  --tool '{type: mcp_toolset, mcp_server_name: apollo}' `
  --tool '{type: mcp_toolset, mcp_server_name: hubspot}' `
  --tool '{type: mcp_toolset, mcp_server_name: slack}' `
  --tool '{type: mcp_toolset, mcp_server_name: calendly}' `
  --mcp-server '{type: url, name: apollo, url: https://mcp.apollo.io/mcp}' `
  --mcp-server '{type: url, name: hubspot, url: https://mcp.hubspot.com/anthropic}' `
  --mcp-server '{type: url, name: slack, url: https://mcp.slack.com/mcp}' `
  --mcp-server '{type: url, name: calendly, url: https://mcp.calendly.com}'
```

## Environnement Anthropic

```bash
ant beta:environments create \
  --name "pixelrises-lead-to-deal-env" \
  --config '{type: cloud, networking: {type: unrestricted}}'
```

## Workflow cible

1. Recevoir une cible commerciale claire : niche, ville, taille entreprise, persona, signaux d'achat.
2. Rechercher les prospects dans Apollo.io.
3. Verifier et enrichir les donnees utiles.
4. Dedoublonner dans HubSpot avant creation.
5. Creer ou mettre a jour contact, entreprise et deal.
6. Assigner le bon owner commercial.
7. Notifier Slack avec resume clair et prochaines actions.
8. Fournir un lien Calendly au commercial ou au prospect selon le niveau d'automatisation valide.
9. Journaliser toutes les actions et erreurs.

## Garde-fous recommandes

- Mode V1 conseille : validation humaine avant tout email sortant.
- Ne pas contacter de prospects sans base legale, opt-out clair et verification des donnees.
- Limiter le volume par campagne pour eviter les erreurs et proteger la reputation domaine.
- Toujours dedoublonner par email, domaine et entreprise.
- Toujours logger : source, date, criteres de recherche, action realisee, statut et erreur eventuelle.
- Si une donnee critique manque, creer une tache de revue humaine au lieu d'automatiser l'etape.

## Utilisation recommandee pour Pixelrises

Cet agent peut aider plus tard sur :
- la prospection B2B locale,
- la creation automatique de fiches prospects,
- la relance commerciale structuree,
- les notifications internes,
- le suivi des opportunites,
- les rendez-vous demo Pixelrises.

Il ne doit pas etre utilise pour :
- envoyer des emails massifs non valides,
- contourner les regles RGPD,
- manipuler les credits utilisateurs,
- acceder au backend Pixelrises sensible,
- modifier Stripe ou Supabase.

