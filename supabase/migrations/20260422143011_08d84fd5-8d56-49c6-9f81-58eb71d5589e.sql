-- Cohérence statuts : tous les 'generated' deviennent 'draft'
UPDATE public.generated_sites SET status = 'draft' WHERE status = 'generated';

-- Remonter les comptes test bloqués (jamais utilisés vraiment) à 10 crédits pour cohérence
UPDATE public.user_credits SET credits = 10, updated_at = now() WHERE credits < 10 AND total_used = 0;