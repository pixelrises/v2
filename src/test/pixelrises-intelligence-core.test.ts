import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildPixelrisesCoreContext,
  buildPixelrisesSystemPrompt,
  createPixelrisesFeedbackEntry,
  estimatePixelrisesCoreCost,
  pixelrisesExamplesLibrary,
  pixelrisesFeedbackStorageKey,
  pixelrisesKnowledgeBase,
  pixelrisesQualityCriteria,
  pixelrisesSystemPromptCore,
  readPixelrisesFeedbackEntries,
  savePixelrisesFeedbackEntry,
  scorePixelrisesGeneration,
} from "@/modules/ai";

const projectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Pixelrises Intelligence Core P9-E", () => {
  it("centralise la vision Pixelrises sans pretendre a du fine-tuning", () => {
    const core = buildPixelrisesCoreContext({ generationType: "site_landing" });

    expect(core.name).toBe("Pixelrises Intelligence Core");
    expect(core.fineTuningStatus).toBe("not_fine_tuned");
    expect(core.serverStorageStatus).toBe("prepared_not_connected");
    expect(core.systemPromptCore).toContain("Tu es une IA Pixelrises");
    expect(core.systemPromptCore).toContain("pas comme une IA generale");
    expect(pixelrisesSystemPromptCore).not.toMatch(/fine-tun(e|ing).*actif|modele fine-tune/i);
    expect(pixelrisesKnowledgeBase.vision).toEqual(expect.arrayContaining(["conversion-first", "mobile-first", "pas de faux succes"]));
  });

  it("prepare un system prompt commun reutilisable par les espaces IA sans secret", () => {
    const prompt = buildPixelrisesSystemPrompt("Student AI");

    expect(prompt).toContain("Espace actif: Student AI");
    expect(prompt).toContain("validation humaine");
    expect(prompt).not.toMatch(/AI_GATEWAY_API_KEY|SERVICE_ROLE|STRIPE_SECRET_KEY|vck_|sk_live|provider secret/i);
  });

  it("calcule un score Pixelrises et bloque les faux succes ou details internes", () => {
    const safe = scorePixelrisesGeneration({
      prompt: "Cree une fiche de revision",
      output: "Voici une fiche claire avec quiz, methode, prochaine action et validation honnete.",
    });
    const unsafe = scorePixelrisesGeneration({
      prompt: "Publie mon site",
      output: "Votre site est automatiquement publie avec provider model id et revenu garanti.",
    });

    expect(safe.status).toBe("pass");
    expect(safe.advancedOnly).toBe(true);
    expect(unsafe.status).toBe("blocked");
    expect(unsafe.issues.join(" ")).toMatch(/faux succes|Promesse|interne/i);
  });

  it("prepare une feedback loop locale sans stockage serveur pretendu", () => {
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        clear: vi.fn(() => {
          store = {};
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
      };
    })();

    vi.stubGlobal("window", { localStorage: localStorageMock });
    const entry = createPixelrisesFeedbackEntry({
      space: "student",
      prompt: "Contact test@example.com et fais mon devoir",
      response: "Je guide sans triche.",
      feedback: "not_in_vision",
      expectedCorrection: "Aide-moi a comprendre la methode.",
      generationType: "study_sheet",
      score: 74,
    });

    savePixelrisesFeedbackEntry(entry);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(pixelrisesFeedbackStorageKey, expect.any(String));
    expect(readPixelrisesFeedbackEntries()[0].prompt).toContain("[PERSONAL_DATA_REDACTED]");
    vi.unstubAllGlobals();
  });

  it("contient une examples library fondatrice et des couts estimes no-debit-on-failure", () => {
    expect(pixelrisesExamplesLibrary.length).toBeGreaterThanOrEqual(4);
    expect(pixelrisesExamplesLibrary.some((example) => example.category === "student" && example.validated)).toBe(true);
    expect(pixelrisesExamplesLibrary.some((example) => example.category === "avoid" && example.type === "bad")).toBe(true);
    expect(pixelrisesQualityCriteria.map((criterion) => criterion.id)).toEqual(
      expect.arrayContaining(["security", "product_honesty", "anti_generic", "intent_match"]),
    );

    const siteCost = estimatePixelrisesCoreCost("site_landing");
    expect(siteCost.mode).toBe("estimated_only");
    expect(siteCost.noDebitOnFailure).toBe(true);
    expect(siteCost.estimatedCredits).toBeGreaterThan(0);
  });

  it("connecte le Core aux AI Spaces et masque provider/model cote client", () => {
    const assistant = projectFile("src/modules/ai-spaces/assistant.ts");
    const edge = projectFile("supabase/functions/ai-space-chat/index.ts");
    const backendClient = projectFile("src/modules/ai/backend-orchestrator.ts");
    const backendEdge = projectFile("supabase/functions/ai-orchestrator/index.ts");

    expect(assistant).toContain("buildPixelrisesCoreContext");
    expect(assistant).toContain("pixelrisesCore");
    expect(edge).toContain("buildPixelrisesCorePrompt");
    expect(edge).toContain("Ce Core n'est pas du fine-tuning");
    expect(edge).not.toContain("provider: getAIProviderName()");
    expect(edge).not.toContain("model: \"local-structured-response\"");
    expect(backendClient).toContain("delete safeResponse.provider");
    expect(backendClient).toContain("delete safeResponse.model");
    const frontendResponseBlock = backendEdge.slice(backendEdge.lastIndexOf("routingTrace: execution.taskResults") - 500);
    expect(frontendResponseBlock).not.toContain("provider: execution.provider");
    expect(frontendResponseBlock).not.toContain("model: execution.model");
  });
});
