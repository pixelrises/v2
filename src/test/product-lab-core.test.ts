import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildResearchEvidence,
  classifyImprovement,
  findApprovedAdminDecision,
  getProductLabReviewItemId,
  getThemeForParisDate,
  mergeApprovedAdminFindings,
  redactSecrets,
  renderBacklog,
  renderDailyReport,
  runProductLab,
  scoreProduct,
  selectProductLabReviewFindings,
  trustedResearchSources,
} from "../../scripts/product-lab-core.mjs";

const createTempProject = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pixelrises-product-lab-"));
  const write = (relativePath: string, content: string) => {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, "utf8");
  };

  write("package.json", JSON.stringify({ scripts: { lint: "echo ok", test: "echo ok", build: "echo ok" } }));
  write("src/pages/Dashboard.tsx", "export const Dashboard = () => 'Dashboard';");
  write("src/pages/Create.tsx", "export const Create = () => 'Create';");
  write("src/pages/SiteBuilder.tsx", "export const SiteBuilder = () => 'Site Builder';");
  write("src/pages/AgentBuilder.tsx", "export const AgentBuilder = () => 'Agent Builder';");
  write("src/pages/GameBuilder.tsx", "export const GameBuilder = () => 'Game Builder beta';");
  write("src/pages/Integrations.tsx", "export const Integrations = () => 'Integrations';");
  write("src/pages/Templates.tsx", "export const Templates = () => 'Templates';");
  write("src/pages/Analytics.tsx", "export const Analytics = () => 'Analytics';");
  write("src/pages/Settings.tsx", "export const Settings = () => 'Settings';");
  write("src/modules/ai/orchestrator/AIOrchestrator.ts", "export const ai = 'orchestrator';");
  write("src/modules/ai/backend-orchestrator.ts", "export const backend = 'AI_GATEWAY';");
  write("src/modules/storage/project-storage-adapter.ts", "export const ProjectStorageAdapter = 'adapter';");
  write("supabase/functions/ai-orchestrator/index.ts", "const qualityGate = true;");

  return root;
};

describe("Pixelrises Product Lab core", () => {
  it("selects the Tuesday Europe/Paris theme as site-builder", () => {
    const theme = getThemeForParisDate(new Date("2026-05-05T10:00:00.000Z"));
    expect(theme.id).toBe("site-builder");
  });

  it("keeps scores bounded between 0 and 100", () => {
    const scores = scoreProduct({
      hasProductLabScripts: true,
      missingRuntimeFiles: [],
      hasQualityGate: true,
      mojibakeHits: [],
      hasGateway: true,
      hasStorageAdapter: true,
      hasExistingBrokenWorkflow: false,
      currentTheme: { id: "site-builder" },
    });

    for (const score of Object.values(scores) as Array<{ note: number }>) {
      expect(score.note).toBeGreaterThanOrEqual(0);
      expect(score.note).toBeLessThanOrEqual(100);
    }
  });

  it("classifies safe improvements and dangerous changes separately", () => {
    expect(
      classifyImprovement({
        title: "Ameliorer microcopy empty state",
        module: "Dashboard",
        description: "Microcopy plus claire",
        risk: "Faible",
      }),
    ).toBe("auto_safe");

    expect(
      classifyImprovement({
        title: "Changer Stripe credits utilisateurs",
        module: "Paiement",
        description: "Modification credits",
        risk: "Eleve",
      }),
    ).toBe("human_validation");
  });

  it("redacts gateway and bearer secrets", () => {
    const redacted = redactSecrets("AI_GATEWAY_API_KEY=vck_1234567890abcdefghijklmnopqrstuvwxyz Bearer secret-token-1234567890");
    expect(redacted).not.toContain("vck_1234567890");
    expect(redacted).not.toContain("secret-token-1234567890");
    expect(redacted).toContain("[REDACTED]");
  });

  it("uses a static research fallback when live verification has not run", () => {
    const root = createTempProject();
    const evidence = buildResearchEvidence(root, { id: "site-builder" });

    expect(evidence.mode).toBe("static_fallback");
    expect(evidence.total).toBeGreaterThanOrEqual(3);
    expect(evidence.verifiedCount).toBe(0);
    expect(evidence.sources.some((source) => source.id === "vercel-ai-gateway")).toBe(true);
  });

  it("loads live research verification without exposing secrets", () => {
    const root = createTempProject();
    fs.mkdirSync(path.join(root, "product-lab/state"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "product-lab/state/research-sources.json"),
      JSON.stringify({
        mode: "live",
        verifiedAt: "2026-05-08T12:00:00.000Z",
        results: {
          "vercel-ai-gateway": {
            id: "vercel-ai-gateway",
            status: "verified",
            httpStatus: 200,
            verifiedAt: "2026-05-08T12:00:00.000Z",
          },
        },
      }),
      "utf8",
    );

    const evidence = buildResearchEvidence(root, { id: "site-builder" });

    expect(evidence.mode).toBe("live");
    expect(evidence.verifiedCount).toBe(1);
    expect(JSON.stringify(evidence)).not.toContain("AI_GATEWAY_API_KEY");
  });

  it("keeps trusted research sources allowlisted and non-empty", () => {
    expect(trustedResearchSources.length).toBeGreaterThanOrEqual(6);
    for (const source of trustedResearchSources) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.principles.length).toBeGreaterThan(0);
    }
  });

  it("renders backlog sections with decisions", () => {
    const backlog = renderBacklog([
      {
        title: "Corriger microcopy",
        module: "UX",
        impact: "Moyen",
        risk: "Faible",
        difficulty: "Faible",
        priority: "Important",
        status: "Propose",
        inspiration: "Shopify Admin",
        decision: "auto_safe",
        scoreImpact: 18,
      },
    ]);

    expect(backlog).toContain("## Critique");
    expect(backlog).toContain("## Important");
    expect(backlog).toContain("Decision: auto_safe");
  });

  it("runs a dry-run without AI_GATEWAY_API_KEY and creates reports", () => {
    const root = createTempProject();
    const previousGatewayKey = process.env.AI_GATEWAY_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;

    const result = runProductLab({
      root,
      action: "daily",
      dryRun: true,
      forcedTheme: "site-builder",
      date: new Date("2026-05-05T10:00:00.000Z"),
    });

    if (previousGatewayKey === undefined) {
      delete process.env.AI_GATEWAY_API_KEY;
    } else {
      process.env.AI_GATEWAY_API_KEY = previousGatewayKey;
    }

    expect(result.dryRun).toBe(true);
    expect(fs.existsSync(path.join(root, "reports/product-lab/daily/daily-2026-05-05.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "product-lab/backlog.md"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public/product-lab-review.json"))).toBe(true);
  });

  it("creates a balanced admin review queue with multiple actionable proposals", () => {
    const root = createTempProject();
    fs.mkdirSync(path.join(root, "product-lab/state"), { recursive: true });
    fs.writeFileSync(path.join(root, "product-lab/state/first-dry-run-approved.json"), '{"approved":true}', "utf8");

    runProductLab({
      root,
      action: "daily",
      dryRun: true,
      forcedTheme: "site-builder",
      date: new Date("2026-05-05T10:00:00.000Z"),
    });

    const queue = JSON.parse(fs.readFileSync(path.join(root, "public/product-lab-review.json"), "utf8"));
    const modules = new Set(queue.items.map((item: { module: string }) => item.module));

    expect(queue.items.length).toBeGreaterThanOrEqual(5);
    expect(queue.items.length).toBeLessThanOrEqual(8);
    expect(modules.size).toBeGreaterThanOrEqual(5);
    expect(queue.summary.total).toBe(queue.items.length);
  });

  it("caps review findings at eight while keeping module diversity", () => {
    const findings = Array.from({ length: 12 }, (_, index) => ({
      title: `Proposition ${index}`,
      module: index === 0 ? "Site Builder" : `Module ${index}`,
      impact: index % 2 === 0 ? "Eleve" : "Moyen",
      risk: "Faible",
      difficulty: "Faible",
      priority: index === 0 ? "Critique" : "Important",
      status: "Propose",
      inspiration: "Lovable / v0",
      description: "Amelioration actionnable et non destructive.",
      decision: "auto_safe",
      scoreImpact: 20 - index,
    }));

    const selected = selectProductLabReviewFindings(findings, { id: "site-builder" });

    expect(selected).toHaveLength(8);
    expect(selected[0].module).toBe("Site Builder");
    expect(new Set(selected.map((finding) => finding.module)).size).toBe(8);
  });

  it("renders a report with mandatory sections", () => {
    const root = createTempProject();
    const result = runProductLab({
      root,
      action: "daily",
      dryRun: true,
      forcedTheme: "site-builder",
      date: new Date("2026-05-05T10:00:00.000Z"),
    });
    const report = renderDailyReport(result);

    expect(report).toContain("## Scores du jour");
    expect(report).toContain("## Vision Pixelrises protegee");
    expect(report).toContain("Pixelrises transforme une idee en projet digital concret");
    expect(report).toContain("## Benchmark niveau inspirations");
    expect(report).toContain("Dashboard");
    expect(report).toContain("Site Builder");
    expect(report).toContain("## Agents experts consultes");
    expect(report).toContain("## Recherche fiable et verification live");
    expect(report).toContain("Vercel AI Gateway");
    expect(report).toContain("## Ameliorations necessitant validation humaine");
    expect(report).toContain("## Risques restants");
  });

  it("generates a weekly report on weekly dry-run", () => {
    const root = createTempProject();
    const result = runProductLab({
      root,
      action: "weekly",
      dryRun: true,
      forcedTheme: "site-builder",
      date: new Date("2026-05-05T10:00:00.000Z"),
    });

    expect(result.weeklyReportPath).toBe("reports/product-lab/weekly/weekly-2026-W19.md");
    expect(fs.existsSync(path.join(root, result.weeklyReportPath))).toBe(true);
  });

  it("applies at most two approved safe improvements outside dry-run", () => {
    const root = createTempProject();
    const previousApply = process.env.PRODUCT_LAB_APPLY_SAFE_FIXES;
    const previousMaxPatches = process.env.PRODUCT_LAB_MAX_PATCHES;
    process.env.PRODUCT_LAB_APPLY_SAFE_FIXES = "true";
    process.env.PRODUCT_LAB_MAX_PATCHES = "2";
    fs.mkdirSync(path.join(root, "product-lab/state"), { recursive: true });
    fs.writeFileSync(path.join(root, "product-lab/state/first-dry-run-approved.json"), '{"approved":true}', "utf8");
    fs.writeFileSync(
      path.join(root, "product-lab/state/admin-decisions.json"),
      JSON.stringify({
        decisions: [
          {
            itemId: getProductLabReviewItemId(
              {
                module: "Site Builder",
                title: "Ameliorer le flow Site Builder preview",
              },
              { id: "site-builder" },
            ),
            status: "approved",
            automationAction: "authorize_next_run",
          },
        ],
      }),
      "utf8",
    );

    const result = runProductLab({
      root,
      action: "daily",
      dryRun: false,
      forcedTheme: "site-builder",
      date: new Date("2026-05-05T10:00:00.000Z"),
    });

    if (previousApply === undefined) {
      delete process.env.PRODUCT_LAB_APPLY_SAFE_FIXES;
    } else {
      process.env.PRODUCT_LAB_APPLY_SAFE_FIXES = previousApply;
    }

    if (previousMaxPatches === undefined) {
      delete process.env.PRODUCT_LAB_MAX_PATCHES;
    } else {
      process.env.PRODUCT_LAB_MAX_PATCHES = previousMaxPatches;
    }

    expect(result.appliedImprovements.length).toBeGreaterThan(0);
    expect(result.appliedImprovements.length).toBeLessThanOrEqual(2);
    expect(
      result.modifiedFiles.every(
        (file) => file.startsWith("docs/") || file.startsWith("product-lab/") || file.startsWith("reports/"),
      ),
    ).toBe(true);
  });

  it("creates run-scoped review item ids so old validations do not hide new proposals", () => {
    const root = createTempProject();
    const result = runProductLab({
      root,
      action: "daily",
      dryRun: true,
      forcedTheme: "site-builder",
      date: new Date("2026-05-05T10:00:00.000Z"),
    });
    const queue = JSON.parse(fs.readFileSync(path.join(root, "public/product-lab-review.json"), "utf8"));

    expect(result.date).toBe("2026-05-05");
    expect(queue.items.length).toBeGreaterThanOrEqual(5);
    expect(queue.items.every((item: { id: string }) => item.id.startsWith("2026-05-05-site-builder-"))).toBe(true);
    expect(queue.sourceRun.runId).toBe("2026-05-05-site-builder");
  });

  it("keeps legacy admin approvals valid by matching title and module", () => {
    const decision = findApprovedAdminDecision(
      {
        "2026-05-06-agent-builder-agent-builder-1": {
          itemId: "2026-05-06-agent-builder-agent-builder-1",
          title: "Durcir la securite des actions agents",
          module: "Agent Builder",
          sourceTheme: "Agent Builder / Agents IA",
          status: "approved",
          automationAction: "authorize_next_run",
        },
      },
      {
        title: "Durcir la securite des actions agents",
        module: "Agent Builder",
      },
      {
        id: "agent-builder",
        label: "Agent Builder / Agents IA",
      },
    );

    expect(decision?.itemId).toBe("2026-05-06-agent-builder-agent-builder-1");
  });

  it("keeps approved admin decisions actionable even when the daily theme changes", () => {
    const approvedFindings = mergeApprovedAdminFindings(
      [],
      {
        "2026-05-06-agent-builder-agent-builder-1": {
          itemId: "2026-05-06-agent-builder-agent-builder-1",
          title: "Durcir la securite des actions agents",
          module: "Agent Builder",
          sourceTheme: "Agent Builder / Agents IA",
          status: "approved",
          automationAction: "authorize_next_run",
          reviewItem: {
            title: "Durcir la securite des actions agents",
            module: "Agent Builder",
            impact: "Eleve",
            risk: "Moyen",
            difficulty: "Moyenne",
            priority: "Important",
            afterState: "Chaque permission sensible reste visible et validable.",
          },
        },
      },
      {
        id: "site-builder",
        label: "Site Builder / Conversion",
      },
    );

    expect(approvedFindings).toHaveLength(1);
    expect(approvedFindings[0].approvedItemId).toBe("2026-05-06-agent-builder-agent-builder-1");
    expect(approvedFindings[0].module).toBe("Agent Builder");
  });

  it("runs V2 generator smoke QA in the nightly workflow before PR creation", () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), ".github/workflows/product-lab-nightly.yml"), "utf8");

    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/setup-node@v6");
    expect(workflow).toContain('node-version: "24"');
    expect(workflow).toContain("actions/upload-artifact@v7");
    expect(workflow).toContain("peter-evans/create-pull-request@v8");
    expect(workflow).toContain("Run V2 generator smoke QA");
    expect(workflow).toContain("Check V2 generator smoke QA configuration");
    expect(workflow).toContain("npm run smoke:generator");
    expect(workflow).toContain("vars.PIXELRISES_GENERATOR_DAILY_REAL_BUDGET || '20'");
    expect(workflow).toContain("steps.smoke_preflight.outputs.ready == 'true'");
    expect(workflow).toContain("steps.generator_smoke.outcome");
    expect(workflow).toContain("PRODUCT_LAB_REQUIRE_SUPABASE_SYNC: \"true\"");
    expect(workflow).toContain("steps.proposals_push.outcome");
    expect(workflow).toContain("Fail if Product Lab admin sync failed");
    expect(workflow).toContain("tmp/generator-smoke-last.json");
    expect(workflow).toContain("Report blocked Product Lab PR");
    expect(workflow).toContain("(s.approvedFindings||[]).length > 0 && (s.appliedImprovements||[]).length > 0");
  });

  it("keeps all V2 GitHub Actions on the Node 24 action generation", () => {
    const workflowsDir = path.join(process.cwd(), ".github/workflows");
    const workflowBundle = fs
      .readdirSync(workflowsDir)
      .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
      .map((file) => fs.readFileSync(path.join(workflowsDir, file), "utf8"))
      .join("\n");

    expect(workflowBundle).not.toMatch(/actions\/checkout@v4/);
    expect(workflowBundle).not.toMatch(/actions\/setup-node@v4/);
    expect(workflowBundle).not.toMatch(/actions\/upload-artifact@v4/);
    expect(workflowBundle).not.toContain('node-version: "20"');
  });

  it("does not silently skip enabled V2 real QA when smoke credentials are missing", () => {
    const smokeScript = fs.readFileSync(path.join(process.cwd(), "scripts/smoke-generate-site.mjs"), "utf8");

    expect(smokeScript).toContain("Generator smoke test requires PIXELRISES_SMOKE_BEARER_TOKEN");
    expect(smokeScript).not.toContain("smoke credentials are not configured. No credits were consumed.");
  });

  it("removes the first dry-run proposal after human approval", () => {
    const root = createTempProject();
    fs.mkdirSync(path.join(root, "product-lab/state"), { recursive: true });
    fs.writeFileSync(path.join(root, "product-lab/state/first-dry-run-approved.json"), '{"approved":true}', "utf8");

    runProductLab({
      root,
      action: "daily",
      dryRun: false,
      forcedTheme: "agent-builder",
      date: new Date("2026-05-06T10:00:00.000Z"),
    });

    const backlog = fs.readFileSync(path.join(root, "product-lab/backlog.md"), "utf8");
    const reviewQueue = fs.readFileSync(path.join(root, "public/product-lab-review.json"), "utf8");

    expect(backlog).not.toContain("Verrouiller le premier Product Lab en dry-run");
    expect(reviewQueue).not.toContain("Verrouiller le premier Product Lab en dry-run");
  });
});
