-- Align Phase 10 credit cost rules with the production profitability model.
-- Non destructive: adds recommended estimates and updates active cost metadata only.

alter table public.credit_cost_rules
  add column if not exists recommended_credit_cost integer,
  add column if not exists estimated_internal_cost_eur numeric(10, 4),
  add column if not exists minimum_margin_ratio numeric(8, 2);

with recommended(action_type, builder_type, quality_mode, base_cost, complexity_level, recommended_credit_cost, estimated_internal_cost_eur, minimum_margin_ratio) as (
  values
    ('general_question', 'ai_space', 'economy', 1, 'simple', 1, 0.0100, 5.00),
    ('quick_rewrite', 'ai_space', 'standard', 1, 'simple', 1, 0.0150, 5.00),
    ('student_sheet', 'ai_space', 'standard', 3, 'medium', 4, 0.0400, 6.00),
    ('student_quiz', 'ai_space', 'standard', 4, 'medium', 5, 0.0500, 6.00),
    ('creator_script', 'ai_space', 'standard', 5, 'medium', 7, 0.0800, 7.00),
    ('business_plan', 'ai_space', 'quality', 7, 'advanced', 26, 0.1500, 7.00),
    ('site_generation', 'site', 'standard', 5, 'advanced', 13, 0.4500, 3.50),
    ('site_section_improve', 'site', 'standard', 2, 'medium', 4, 0.0900, 4.00),
    ('site_seo_analysis', 'site', 'quality', 5, 'medium', 10, 0.1400, 4.00),
    ('site_export_advanced', 'export', 'standard', 6, 'advanced', 12, 0.0600, 5.00),
    ('game_blueprint', 'game', 'standard', 8, 'advanced', 19, 0.3500, 4.00),
    ('game_prototype', 'game', 'quality', 16, 'premium', 92, 1.2000, 4.00),
    ('game_package', 'game', 'quality', 18, 'premium', 114, 1.4000, 4.00),
    ('game_script_generation', 'game', 'quality', 10, 'advanced', 36, 0.4500, 4.00),
    ('agent_generation', 'agent', 'standard', 7, 'advanced', 15, 0.2500, 4.00),
    ('agent_improve', 'agent', 'standard', 4, 'medium', 6, 0.0800, 7.00),
    ('agent_test_chat', 'agent', 'economy', 1, 'simple', 1, 0.0150, 5.00),
    ('automation_scenario', 'automation', 'standard', 5, 'medium', 7, 0.0800, 7.00),
    ('analytics_recommendation', 'analytics', 'standard', 3, 'medium', 5, 0.0500, 7.00)
)
insert into public.credit_cost_rules (
  action_type,
  builder_type,
  quality_mode,
  base_cost,
  complexity_level,
  plan_multiplier,
  recommended_credit_cost,
  estimated_internal_cost_eur,
  minimum_margin_ratio,
  is_active
)
select
  action_type,
  builder_type,
  quality_mode,
  base_cost,
  complexity_level,
  1,
  recommended_credit_cost,
  estimated_internal_cost_eur,
  minimum_margin_ratio,
  true
from recommended
on conflict (action_type, builder_type, quality_mode) do update
set base_cost = excluded.base_cost,
    complexity_level = excluded.complexity_level,
    recommended_credit_cost = excluded.recommended_credit_cost,
    estimated_internal_cost_eur = excluded.estimated_internal_cost_eur,
    minimum_margin_ratio = excluded.minimum_margin_ratio,
    is_active = true,
    updated_at = now();

select pg_notify('pgrst', 'reload schema');
