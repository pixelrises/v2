-- Phase 11 launch-readiness grants.
-- Non-destructive: adds explicit API grants for Phase 3-8 tables that already rely on RLS.
-- Review before applying live. No anon access is granted here.

grant usage on schema public to authenticated, service_role;

-- Keep Phase 3-8 user data closed to anon by default.
revoke all on table
  public.projects,
  public.generations,
  public.project_versions,
  public.agents,
  public.games,
  public.analytics_events,
  public.ai_usage_logs,
  public.integration_statuses,
  public.ai_space_preferences,
  public.ai_space_conversations,
  public.ai_space_messages,
  public.ai_space_usage_logs,
  public.ai_space_feedback,
  public.ai_space_actions,
  public.ai_space_templates_used,
  public.agent_templates,
  public.agent_permissions,
  public.agent_runs,
  public.agent_messages,
  public.agent_actions,
  public.automation_templates,
  public.automations,
  public.automation_steps,
  public.automation_runs,
  public.automation_logs,
  public.integration_connections,
  public.integration_logs,
  public.leads,
  public.form_submissions,
  public.game_blueprints,
  public.game_versions,
  public.game_assets,
  public.game_scripts,
  public.game_quality_scores,
  public.game_exports,
  public.product_lab_review_items,
  public.product_lab_decisions,
  public.product_lab_v1_review_items,
  public.product_lab_v1_decisions,
  public.product_lab_pr_status,
  public.product_lab_v1_pr_status
from anon;

-- User-owned app data. RLS keeps each user scoped to their own rows.
grant select, insert, update, delete on table
  public.projects,
  public.agents,
  public.games,
  public.integration_statuses,
  public.agent_permissions,
  public.agent_runs,
  public.agent_messages,
  public.agent_actions,
  public.automations,
  public.automation_steps,
  public.automation_runs,
  public.automation_logs,
  public.integration_connections,
  public.integration_logs,
  public.leads,
  public.form_submissions,
  public.game_blueprints,
  public.game_versions,
  public.game_assets,
  public.game_scripts,
  public.game_quality_scores,
  public.game_exports
to authenticated;

grant select, insert on table
  public.generations,
  public.project_versions,
  public.analytics_events,
  public.ai_usage_logs,
  public.ai_space_messages,
  public.ai_space_usage_logs,
  public.ai_space_feedback,
  public.ai_space_templates_used
to authenticated;

grant select, insert, update on table
  public.ai_space_preferences,
  public.ai_space_conversations,
  public.ai_space_actions
to authenticated;

-- Shared templates are readable to logged-in users only. Mutations stay server-side.
alter table public.agent_templates enable row level security;
alter table public.automation_templates enable row level security;

drop policy if exists "Authenticated can read agent templates" on public.agent_templates;
create policy "Authenticated can read agent templates"
  on public.agent_templates
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can read automation templates" on public.automation_templates;
create policy "Authenticated can read automation templates"
  on public.automation_templates
  for select
  to authenticated
  using (true);

grant select on table
  public.agent_templates,
  public.automation_templates
to authenticated;

-- Product Lab remains admin-only through RLS policies.
grant select, insert, update on table
  public.product_lab_review_items,
  public.product_lab_decisions,
  public.product_lab_v1_review_items,
  public.product_lab_v1_decisions,
  public.product_lab_pr_status,
  public.product_lab_v1_pr_status
to authenticated;

-- Service role keeps server/workflow control. It must never be used in the frontend.
grant all on table
  public.projects,
  public.generations,
  public.project_versions,
  public.agents,
  public.games,
  public.analytics_events,
  public.ai_usage_logs,
  public.integration_statuses,
  public.ai_space_preferences,
  public.ai_space_conversations,
  public.ai_space_messages,
  public.ai_space_usage_logs,
  public.ai_space_feedback,
  public.ai_space_actions,
  public.ai_space_templates_used,
  public.agent_templates,
  public.agent_permissions,
  public.agent_runs,
  public.agent_messages,
  public.agent_actions,
  public.automation_templates,
  public.automations,
  public.automation_steps,
  public.automation_runs,
  public.automation_logs,
  public.integration_connections,
  public.integration_logs,
  public.leads,
  public.form_submissions,
  public.game_blueprints,
  public.game_versions,
  public.game_assets,
  public.game_scripts,
  public.game_quality_scores,
  public.game_exports,
  public.product_lab_review_items,
  public.product_lab_decisions,
  public.product_lab_v1_review_items,
  public.product_lab_v1_decisions,
  public.product_lab_pr_status,
  public.product_lab_v1_pr_status
to service_role;

notify pgrst, 'reload schema';
