import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getTemplateUseHref,
  pixelrisesTemplates,
  templateUsageStorageKey,
} from "@/modules/templates/template-registry";

const root = process.cwd();
const readProjectFile = (file: string) => readFileSync(join(root, file), "utf8");

describe("P9-F Templates Pixelrises", () => {
  it("keeps /templates routed to the dedicated templates page", () => {
    const app = readProjectFile("src/App.tsx");
    expect(app).toContain('const Templates = lazy(() => import("./pages/Templates"))');
    expect(app).toContain('<Route path="/templates" element={<Templates />} />');
  });

  it("creates a quality library of 40 routed templates", () => {
    expect(pixelrisesTemplates).toHaveLength(40);

    for (const template of pixelrisesTemplates) {
      expect(template.templateId).toBeTruthy();
      expect(template.title).toBeTruthy();
      expect(template.category).toBeTruthy();
      expect(template.targetSpace).toMatch(/business|student|agent-studio|creator-soon/);
      expect(template.command).toMatch(/^\//);
      expect(template.prefilledPrompt).toContain(template.command);
      expect(template.expectedOutput).toBeTruthy();
      expect(template.requiredInputs.length).toBeGreaterThan(0);
      expect(template.estimatedCost).toBeGreaterThan(0);
      expect(template.safetyNotes.length).toBeGreaterThan(0);
      expect(template.structure.length).toBeGreaterThan(0);
      expect(template.previewSpec.layoutType).toBeTruthy();
      expect(template.previewSpec.sampleTitle).toBeTruthy();
      expect(template.previewSpec.cards.length).toBeGreaterThan(0);
      expect(template.previewSpec.exampleOutput).toBeTruthy();
      expect(["pret", "beta", "a-configurer"]).toContain(template.status);
    }
  });

  it("prioritizes Business, Student and the 17 official agents", () => {
    expect(pixelrisesTemplates.filter((template) => template.targetSpace === "business").length).toBeGreaterThanOrEqual(10);
    expect(pixelrisesTemplates.filter((template) => template.targetSpace === "student").length).toBe(8);

    const agentTemplates = pixelrisesTemplates.filter((template) => template.targetSpace === "agent-studio");
    expect(agentTemplates).toHaveLength(17);
    for (const requiredAgent of [
      "Agent Builder",
      "Agent SEO",
      "Agent Design",
      "Agent Copywriting",
      "Agent Conversion",
      "Agent Business",
      "Agent Support",
      "Agent Analytics",
      "Agent Automatisation",
      "Agent Content",
      "Agent Student",
      "Agent Operations",
      "Agent Improve",
      "Agent Game Design",
      "Agent Script",
      "Agent Assets",
      "Agent Publishing",
    ]) {
      expect(agentTemplates.map((template) => template.title)).toContain(requiredAgent);
    }
  });

  it("routes templates to the correct spaces with prefilled prompts", () => {
    const business = pixelrisesTemplates.find((template) => template.templateId === "business-landing-premium");
    const student = pixelrisesTemplates.find((template) => template.templateId === "student-revision-sheet");
    const agent = pixelrisesTemplates.find((template) => template.templateId === "agent-seo");
    const content = pixelrisesTemplates.find((template) => template.templateId === "content-tiktok-script");

    expect(business && getTemplateUseHref(business)).toContain("/ai-spaces/business?");
    expect(student && getTemplateUseHref(student)).toContain("/ai-spaces/student?");
    expect(agent && getTemplateUseHref(agent)).toContain("/builder/agent?");
    expect(content && getTemplateUseHref(content)).toContain("/ai-spaces/business?");

    for (const template of [business, student, agent, content]) {
      expect(template).toBeDefined();
      expect(getTemplateUseHref(template!)).toContain("templatePrompt=");
      expect(getTemplateUseHref(template!)).toContain("templateCommand=");
    }
  });

  it("keeps Creator AI honest and avoids fake success states", () => {
    const contentTemplates = pixelrisesTemplates.filter((template) => template.category === "Content");
    expect(contentTemplates.length).toBeGreaterThan(0);
    for (const template of contentTemplates) {
      expect(template.targetSpace).toBe("creator-soon");
      expect(template.badges).toContain("Creator AI bientot");
      expect(template.previewSpec.layoutType).toBe("content-plan");
      expect(template.previewSpec.heroBadge).toBe("Creator AI bientot");
      expect(template.safetyNotes.join(" ")).toMatch(/brouillon|automatique|bientot|envoi/i);
      expect(template.status).not.toBe("pret");
    }

    const templatesPage = readProjectFile("src/pages/Templates.tsx");
    expect(templatesPage).toContain("Aucun credit n'est debite");
    expect(templatesPage).not.toContain("template publie");
    expect(templatesPage).not.toContain("workflow active");
    expect(templatesPage).not.toContain("Creator AI pret");
    expect(templatesPage).not.toContain("site publie");
    expect(templatesPage).not.toContain("app creee");
    expect(templatesPage).not.toContain("export pret");
  });

  it("shows costs only in preview and stores local usage history", () => {
    const templatesPage = readProjectFile("src/pages/Templates.tsx");
    const cardBlock = templatesPage.slice(templatesPage.indexOf("const TemplateCard"), templatesPage.indexOf("const TemplatePreview"));
    const previewBlock = templatesPage.slice(templatesPage.indexOf("const TemplatePreview"), templatesPage.indexOf("const UsageHistory"));

    expect(cardBlock).not.toContain("estimatedCost");
    expect(previewBlock).toContain("template.estimatedCost");
    expect(templateUsageStorageKey).toBe("pixelrises:v2:templates:usage-history");
  });

  it("makes template previews visual-first instead of prompt-first", () => {
    const templatesPage = readProjectFile("src/pages/Templates.tsx");
    const previewBlock = templatesPage.slice(templatesPage.indexOf("const TemplatePreview"), templatesPage.indexOf("const UsageHistory"));

    expect(previewBlock).toContain("Apercu du template");
    expect(previewBlock).toContain("TemplateVisualPreview");
    expect(previewBlock).toContain("Prompt pre-rempli");
    expect(previewBlock.indexOf("Apercu du template")).toBeLessThan(previewBlock.indexOf("Prompt pre-rempli"));
    expect(previewBlock).toContain('useState<PreviewTab>("apercu")');
  });

  it("adds category-specific visual preview specs", () => {
    const landing = pixelrisesTemplates.find((template) => template.templateId === "business-landing-premium");
    const app = pixelrisesTemplates.find((template) => template.templateId === "business-saas-app");
    const student = pixelrisesTemplates.find((template) => template.templateId === "student-revision-sheet");
    const agent = pixelrisesTemplates.find((template) => template.templateId === "agent-seo");
    const game = pixelrisesTemplates.find((template) => template.templateId === "game-roblox-concept");
    const automation = pixelrisesTemplates.find((template) => template.templateId === "automation-client-workflow");

    expect(landing?.previewSpec.layoutType).toBe("landing");
    expect(landing?.previewSpec.visualBlocks).toContain("Mini navbar");
    expect(landing?.previewSpec.visualBlocks).toContain("Bloc preuve sociale");
    expect(landing?.previewSpec.visualBlocks).toContain("Mini FAQ");
    expect(app?.previewSpec.layoutType).toBe("workspace");
    expect(student?.previewSpec.layoutType).toBe("student-sheet");
    expect(student?.previewSpec.cards.map((card) => card.title)).toContain("Notions cles");
    expect(agent?.previewSpec.layoutType).toBe("agent-card");
    expect(agent?.previewSpec.cards.map((card) => card.title)).toContain("Permissions");
    expect(game?.previewSpec.layoutType).toBe("game-plan");
    expect(automation?.previewSpec.layoutType).toBe("automation-flow");
  });

  it("prefills Business AI, Student AI and Agent Studio without changing sensitive systems", () => {
    const businessWorkspace = readProjectFile("src/components/ai-spaces/BusinessAIWorkspace.tsx");
    const studentWorkspace = readProjectFile("src/components/ai-spaces/StudentAIWorkspace.tsx");
    const agentBuilder = readProjectFile("src/pages/AgentBuilder.tsx");
    const templatesPage = readProjectFile("src/pages/Templates.tsx");

    expect(businessWorkspace).toContain('searchParams.get("templatePrompt")');
    expect(studentWorkspace).toContain('searchParams.get("templatePrompt")');
    expect(agentBuilder).toContain('searchParams.get("templatePrompt")');
    expect(templatesPage).not.toContain("stripe");
    expect(templatesPage).not.toContain("webhook");
    expect(templatesPage).not.toContain("service_role");
  });
});
