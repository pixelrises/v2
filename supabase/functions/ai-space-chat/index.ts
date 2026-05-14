import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAIChatCompletion, getAIProviderName } from "../_shared/ai-provider.ts";
import { sanitizeTextDeep } from "../_shared/text.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AISpaceType = "business" | "student" | "management" | "enterprise" | "creator" | "general";

const readEnv = (key: string, fallback = "") => (Deno.env.get(key) ?? fallback).trim();

const secretPatterns = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /sk-[0-9A-Za-z_-]{20,}/g,
  new RegExp("vck" + "_[0-9A-Za-z_-]{16,}", "g"),
  new RegExp("sb" + "_secret_[0-9A-Za-z_-]{10,}", "g"),
  new RegExp("sb" + "_publishable_[0-9A-Za-z_-]{10,}", "g"),
  /github_pat_[0-9A-Za-z_]+/gi,
  /ghp_[0-9A-Za-z_]{20,}/g,
  /bearer\s+[0-9A-Za-z._-]+/gi,
  /(?<=api[_-]?key["'\s:=]+)[^"',\s]+/gi,
  /(?<=secret["'\s:=]+)[^"',\s]+/gi,
  /(?<=token["'\s:=]+)[^"',\s]+/gi,
];

const redactForResponse = (value: unknown) => {
  const raw = typeof value === "string" ? value : value instanceof Error ? value.message : "Erreur contrôlée.";
  return secretPatterns
    .reduce((safe, pattern) => safe.replace(pattern, "[REDACTED]"), raw)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
};

const modelForSpace = (spaceType: AISpaceType) => {
  if (spaceType === "business") return readEnv("AI_GATEWAY_OPENAI_MODEL") || "openai/gpt-5.4-mini";
  if (spaceType === "student") return readEnv("AI_GATEWAY_BALANCED_MODEL") || "google/gemini-3-flash";
  if (spaceType === "management") return readEnv("AI_GATEWAY_FAST_MODEL") || "mistral/mistral-medium";
  if (spaceType === "enterprise") return readEnv("AI_GATEWAY_CLAUDE_MODEL") || "anthropic/claude-sonnet-4.6";
  if (spaceType === "creator") return readEnv("AI_GATEWAY_OPENAI_MODEL") || "openai/gpt-5.4-mini";
  return readEnv("AI_GATEWAY_BALANCED_MODEL") || "google/gemini-3-flash";
};

const fallbackAnswer = (spaceName: string, prompt: string) => [
  `Mode secours ${spaceName}.`,
  "L'IA reelle n'a pas repondu, donc Pixelrises retourne une structure actionnable sans exposer de secret.",
  "",
  "1. Objectif compris",
  `- ${prompt || "Demande a preciser."}`,
  "",
  "2. Reponse utile",
  "- Clarifie le contexte, choisis une prochaine action et garde les decisions sensibles sous validation.",
  "",
  "3. Prochaine action",
  "- Reformule la demande avec objectif, public cible, contrainte et resultat attendu.",
].join("\n");

const extractAssistantText = (payload: Record<string, unknown>) => {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const first = choices[0] as { message?: { content?: unknown } } | undefined;
  const content = first?.message?.content;
  if (typeof content === "string") return content;
  return "";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = sanitizeTextDeep(await req.json()) as {
      spaceType?: AISpaceType;
      prompt?: string;
      systemPrompt?: string;
      spaceName?: string;
      safetyRules?: string[];
    };

    const spaceType = body.spaceType ?? "general";
    const prompt = String(body.prompt ?? "").trim();
    const spaceName = String(body.spaceName ?? "AI Space Pixelrises");
    const model = modelForSpace(spaceType);

    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: "Prompt manquant." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await createAIChatCompletion({
      model,
      messages: [
        {
          role: "system",
          content: [
            body.systemPrompt || "Tu es l'IA Pixelrises. Reponds clairement et sans exposer de secret.",
            "Tu dois rester dans le cadre de l'espace demande.",
            "Actions sensibles: demander validation utilisateur.",
            `Garde-fous: ${(body.safetyRules ?? []).join(" | ")}`,
          ].join("\n"),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: spaceType === "creator" ? 0.7 : 0.45,
      max_tokens: 1600,
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          source: "mock-fallback",
          provider: "pixelrises-safe-fallback",
          model: "local-structured-response",
          answer: fallbackAnswer(spaceName, prompt),
          recommendations: [],
          builderLinks: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = await response.json();
    const answer = extractAssistantText(payload) || fallbackAnswer(spaceName, prompt);

    return new Response(
      JSON.stringify({
        success: true,
        source: "real",
        provider: getAIProviderName(),
        model,
        answer,
        recommendations: [],
        builderLinks: [],
        usage: payload.usage ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: true,
        source: "mock-fallback",
        provider: "pixelrises-safe-fallback",
        model: "local-structured-response",
        answer: fallbackAnswer("AI Space Pixelrises", ""),
        error: redactForResponse(error),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
