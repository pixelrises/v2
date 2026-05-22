import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { redactPersonalDataForAI, redactSecrets } from "@/modules/ai/security/redactSecrets";

const root = process.cwd();
const readProjectFile = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Phase 11 launch-readiness guardrails", () => {
  it("keeps critical customer routes wired", () => {
    const app = readProjectFile("src/App.tsx");
    const expectedRoutes = [
      "/",
      "/dashboard",
      "/pricing",
      "/billing",
      "/credits",
      "/profile",
      "/settings",
      "/ai-spaces",
      "/ai-spaces/:spaceId",
      "/builder/site",
      "/builder/game",
      "/builder/agent",
      "/builder/tools/:toolId",
      "/analytics",
      "/projects",
      "/automations",
      "/automations/webhooks",
      "/automations/connectors/new",
      "/integrations",
      "/support",
      "/support/new",
      "/admin",
    ];

    for (const route of expectedRoutes) {
      expect(app).toContain(`path="${route}"`);
    }
  });

  it("redacts simulated secrets and personal data before logs or AI payloads", () => {
    const unsafe = [
      "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdefghijklmnopqrstuvwxyz.ABCDEFGHIJKLMNOP",
      "stripe sk_live_1234567890abcdefghijklmnop",
      "webhook whsec_1234567890abcdefghijklmnop",
      "github_pat_1234567890abcdefghijklmnopqrstuvwxyz",
      "email test@example.com",
      "phone +33 6 12 34 56 78",
    ].join(" ");

    const redactedSecrets = redactSecrets(unsafe);
    expect(redactedSecrets).not.toContain("sk_live_");
    expect(redactedSecrets).not.toContain("whsec_");
    expect(redactedSecrets).not.toContain("github_pat_");
    expect(redactedSecrets).not.toContain("eyJ");

    const redactedPersonalData = redactPersonalDataForAI(unsafe);
    expect(redactedPersonalData).not.toContain("test@example.com");
    expect(redactedPersonalData).not.toContain("+33 6 12 34 56 78");
    expect(redactedPersonalData).toContain("[PERSONAL_DATA_REDACTED]");
  });

  it("keeps visible client copy free from internal implementation labels", () => {
    const clientVisibleFiles = [
      "src/pages/PixelrisesAI.tsx",
      "src/components/SiteManager.tsx",
      "src/pages/AnalyticsDetail.tsx",
      "src/modules/analytics/analytics-center.ts",
      "src/modules/ai-spaces/registry.ts",
      "src/modules/registries/index.ts",
    ];
    const forbiddenVisibleCopy = [
      "AI Gateway",
      "Gateway",
      "provider IA",
      "fallback local",
      "mock backend",
      "stack trace",
      "Supabase sensible",
      "OpenAI key",
      "Gemini key",
      "Claude key",
      "Stripe secret",
      "AI_GATEWAY_API_KEY",
      "STRIPE_SECRET_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const combined = clientVisibleFiles.map(readProjectFile).join("\n");
    for (const phrase of forbiddenVisibleCopy) {
      expect(combined).not.toContain(phrase);
    }
  });

  it("prepares explicit Supabase grants for launch validation without opening anon access", () => {
    const grantMigration = readProjectFile("supabase/migrations/20260514052000_phase11_explicit_grants.sql");

    expect(grantMigration).toContain("revoke all on table");
    expect(grantMigration).toContain("from anon");
    expect(grantMigration).toContain("to authenticated");
    expect(grantMigration).toContain("to service_role");
    expect(grantMigration).toContain("alter table public.agent_templates enable row level security");
    expect(grantMigration).toContain("alter table public.automation_templates enable row level security");
    expect(grantMigration).not.toMatch(/grant\s+all\s+on\s+table[\s\S]+to\s+anon/i);
  });

  it("keeps Stripe webhooks signed, idempotent and redacted", () => {
    const webhook = readProjectFile("supabase/functions/stripe-webhook/index.ts");
    const createCheckout = readProjectFile("supabase/functions/create-checkout/index.ts");
    const portal = readProjectFile("supabase/functions/customer-portal/index.ts");

    expect(webhook).toContain("constructEventAsync");
    expect(webhook).toContain("stripe_events");
    expect(webhook).toContain("duplicate");
    expect(webhook).toContain("redactErrorMessage(error)");
    expect(createCheckout).toContain("redactErrorMessage(error)");
    expect(portal).toContain("redactErrorMessage(error)");
    expect(`${webhook}\n${createCheckout}\n${portal}`).not.toContain("error instanceof Error ? error.message");
  });

  it("keeps Edge Function diagnostics redacted before logging", () => {
    const analyzeUrl = readProjectFile("supabase/functions/analyze-url/index.ts");
    const grantCredits = readProjectFile("supabase/functions/grant-dashboard-credits/index.ts");

    expect(analyzeUrl).toContain("redactLogValue(error)");
    expect(grantCredits).toContain("redactLogValue(error)");
    expect(`${analyzeUrl}\n${grantCredits}`).not.toContain('console.error("analyze-url error:", error)');
    expect(`${analyzeUrl}\n${grantCredits}`).not.toContain("error instanceof Error ? error.message");
  });

  it("requires a real website audit when a user submits a URL", () => {
    const analyzeUrl = readProjectFile("supabase/functions/analyze-url/index.ts");
    const recommendationModule = readProjectFile("src/components/RecommendationModule.tsx");

    expect(analyzeUrl).toContain('redirect: "follow"');
    expect(analyzeUrl).toContain("signal: AbortSignal.timeout(15000)");
    expect(analyzeUrl).toContain("extractHtmlSignals");
    expect(analyzeUrl).toContain("Analyse vraiment le HTML fourni");
    expect(analyzeUrl).toContain("createAIChatCompletion");
    expect(analyzeUrl).toContain("AI_GATEWAY_DIAGNOSTIC_MODEL");
    expect(analyzeUrl).toContain("Aucun diagnostic automatique n'a été généré");
    expect(recommendationModule).toContain("buildStrategicDiagnosis");
    expect(recommendationModule).toContain("requiresRealWebsiteAudit");
    expect(recommendationModule).toContain("Aucun faux diagnostic n'a été généré");
    expect(recommendationModule).toContain("Pré-diagnostic stratégique");
    expect(recommendationModule).toContain("Logique de l'analyse");
    expect(recommendationModule).toContain("Pourquoi cette recommandation");
    expect(recommendationModule).toContain("Diagnostic & méthode Pixelrises");
    expect(recommendationModule).toContain("Contrôles qualité inclus");
    expect(recommendationModule).not.toContain("Impossible d'accéder au site pour réaliser l'analyse.");
    expect(analyzeUrl).not.toContain("Impossible d'accéder au site pour réaliser l'analyse.");
    expect(analyzeUrl).not.toContain("buildBlockedSitePrompt");
    expect(analyzeUrl).not.toContain('analysis_source: "blocked_url_brief"');
    expect(recommendationModule).not.toContain("n'a pas pu etre audite automatiquement");
    expect(recommendationModule).not.toContain("L'acces automatique au site est bloque");
    expect(recommendationModule).not.toContain("setDiagnosis(data?.diagnosis || buildStrategicDiagnosis");
    expect(recommendationModule).not.toContain("\"{diagnosis.raison_offre}\"");
    expect(analyzeUrl).not.toContain("generativelanguage.googleapis.com");
    expect(analyzeUrl).not.toContain('"GEMINI_API_KEY"');
  });

  it("keeps Product Lab auto-merge blocked without admin approval and safe checks", () => {
    const governance = readProjectFile("scripts/product-lab-governance.mjs");

    expect(governance).toContain("adminApproved");
    expect(governance).toContain("checksPassed");
    expect(governance).toContain('riskLevel === "high"');
    expect(governance).toContain(".github/workflows/");
    expect(governance).toContain("supabase/migrations/");
    expect(governance).toContain("redactProductLabText");
    expect(governance).toContain("autoMergeStatus: allowed ? \"eligible\" : \"blocked\"");
  });
});
