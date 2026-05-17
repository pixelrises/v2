

# Product Lab - Auto Safe Improvement - 2026-05-17 - Audit Global / Refactor / Tests / Roadmap

Theme: Audit Global / Refactor / Tests / Roadmap
Vision: Pixelrises transforme une idee en projet digital concret.

Objectif auto-safe du jour:
- Ameliorer un module V2 sans casser les routes, la logique IA, Supabase ou l'experience utilisateur.

Patches autorises automatiquement:
- microcopy, labels, empty/loading/error states
- documentation de decisions produit
- tests simples, prompts, registries et garde-fous non destructifs

Propositions retenues:
- Bloquer toute PR si lint tests ou build echouent - CI sans surprise: Valide cote admin. Autorise le prochain run Product Lab a appliquer avec garde-fous.

Validation humaine obligatoire:
- auth, paiement, credits, Supabase sensible, moteur IA principal, suppression de routes/fichiers, refonte majeure, publication jeux.
