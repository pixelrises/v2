import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));
const rootPath = fileURLToPath(new URL(".", import.meta.url));

const PRODUCT_LAB_LOCAL_DECISIONS_ENDPOINT = "/__pixelrises/product-lab-decisions";
const PRODUCT_LAB_LOCAL_DECISIONS_MAX_BYTES = 512 * 1024;

const redactLocalProductLabText = (value: unknown) =>
  String(value ?? "")
    .replace(/(sk|pk|whsec|ghp|github_pat|sb_secret)_[A-Za-z0-9._-]+/g, "$1_***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***")
    .slice(0, 5000);

const sanitizeLocalProductLabStringArray = (value: unknown, maxItems = 20) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .slice(0, maxItems)
        .map((item) => redactLocalProductLabText(item).slice(0, 300))
    : [];

const sanitizeLocalProductLabObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const sanitizeLocalProductLabDecision = (value: unknown) => {
  const decision = sanitizeLocalProductLabObject(value);
  const reviewItem = sanitizeLocalProductLabObject(decision.reviewItem);
  const sourceRun = sanitizeLocalProductLabObject(decision.sourceRun);

  return {
    itemId: redactLocalProductLabText(decision.itemId).slice(0, 220),
    title: redactLocalProductLabText(decision.title || reviewItem.title).slice(0, 240),
    originalTitle: redactLocalProductLabText(decision.originalTitle || reviewItem.originalTitle || reviewItem.title).slice(0, 240),
    module: redactLocalProductLabText(decision.module || reviewItem.module || "Product Lab").slice(0, 120),
    status: ["approved", "rejected", "needs_review", "pending"].includes(String(decision.status))
      ? String(decision.status)
      : "pending",
    note: redactLocalProductLabText(decision.note).slice(0, 1600),
    correctionRequest: redactLocalProductLabText(decision.correctionRequest).slice(0, 1600),
    rejectionMode: ["ignore", "alternative"].includes(String(decision.rejectionMode)) ? decision.rejectionMode : null,
    automationAction: ["hold", "authorize_next_run", "ignore", "request_alternative"].includes(String(decision.automationAction))
      ? String(decision.automationAction)
      : "hold",
    decidedAt: redactLocalProductLabText(decision.decidedAt || new Date().toISOString()).slice(0, 80),
    applicationStatus: "pending",
    processedAt: "",
    processedRun: {},
    persisted: "localStorage",
    sourceRunKey: redactLocalProductLabText(decision.sourceRunKey).slice(0, 240),
    sourceRun: {
      runId: redactLocalProductLabText(sourceRun.runId).slice(0, 180),
      date: redactLocalProductLabText(sourceRun.date).slice(0, 40),
      week: redactLocalProductLabText(sourceRun.week).slice(0, 40),
      theme: redactLocalProductLabText(sourceRun.theme).slice(0, 180),
      reportPath: redactLocalProductLabText(sourceRun.reportPath).slice(0, 260),
    },
    reviewItem: {
      id: redactLocalProductLabText(reviewItem.id || decision.itemId).slice(0, 220),
      title: redactLocalProductLabText(reviewItem.title || decision.title).slice(0, 240),
      originalTitle: redactLocalProductLabText(reviewItem.originalTitle || decision.originalTitle || reviewItem.title).slice(0, 240),
      module: redactLocalProductLabText(reviewItem.module || decision.module || "Product Lab").slice(0, 120),
      domain: redactLocalProductLabText(reviewItem.domain).slice(0, 40),
      simpleSummary: redactLocalProductLabText(reviewItem.simpleSummary).slice(0, 1600),
      priority: redactLocalProductLabText(reviewItem.priority || decision.priority).slice(0, 80),
      impact: redactLocalProductLabText(reviewItem.impact || decision.impact).slice(0, 80),
      risk: redactLocalProductLabText(reviewItem.risk || decision.risk).slice(0, 80),
      difficulty: redactLocalProductLabText(reviewItem.difficulty || decision.difficulty).slice(0, 80),
      status: redactLocalProductLabText(reviewItem.status).slice(0, 120),
      inspiration: redactLocalProductLabText(reviewItem.inspiration || decision.inspiration).slice(0, 200),
      decision: redactLocalProductLabText(reviewItem.decision || decision.decisionKind).slice(0, 80),
      description: redactLocalProductLabText(reviewItem.description || decision.description).slice(0, 3000),
      scoreImpact: Number.isFinite(Number(reviewItem.scoreImpact || decision.scoreImpact))
        ? Number(reviewItem.scoreImpact || decision.scoreImpact)
        : 0,
      sourceReport: redactLocalProductLabText(reviewItem.sourceReport).slice(0, 260),
      automationPolicy: redactLocalProductLabText(reviewItem.automationPolicy).slice(0, 1600),
      concernedFiles: sanitizeLocalProductLabStringArray(reviewItem.concernedFiles || decision.concernedFiles, 25),
      beforeState: redactLocalProductLabText(reviewItem.beforeState || decision.beforeState).slice(0, 1600),
      afterState: redactLocalProductLabText(reviewItem.afterState || decision.afterState).slice(0, 1600),
    },
  };
};

const readRequestBody = (request: import("node:http").IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > PRODUCT_LAB_LOCAL_DECISIONS_MAX_BYTES) {
        reject(new Error("Payload Product Lab local trop volumineux."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });

const sendJson = (response: import("node:http").ServerResponse, statusCode: number, payload: unknown) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const localProductLabDecisionBridge = () => ({
  name: "pixelrises-product-lab-local-decision-bridge",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use(async (request, response, next) => {
      if (!request.url?.startsWith(PRODUCT_LAB_LOCAL_DECISIONS_ENDPOINT)) {
        next();
        return;
      }

      if (request.method !== "POST") {
        sendJson(response, 405, { ok: false, error: "Methode non autorisee." });
        return;
      }

      try {
        const rawBody = await readRequestBody(request);
        const parsed = JSON.parse(rawBody) as { decisions?: unknown[] };
        const decisions = Array.isArray(parsed.decisions)
          ? parsed.decisions.map(sanitizeLocalProductLabDecision).filter((decision) => decision.itemId)
          : [];

        const statePath = path.join(rootPath, "product-lab", "state", "admin-decisions.json");
        fs.mkdirSync(path.dirname(statePath), { recursive: true });
        fs.writeFileSync(
          statePath,
          `${JSON.stringify(
            {
              generatedAt: new Date().toISOString(),
              source: "local-admin-bypass",
              warning: "Local dev only. GitHub Actions and Supabase do not read this file until synced.",
              decisions,
            },
            null,
            2,
          )}\n`,
          "utf8",
        );

        sendJson(response, 200, {
          ok: true,
          count: decisions.length,
          path: "product-lab/state/admin-decisions.json",
        });
      } catch (error) {
        sendJson(response, 400, {
          ok: false,
          error: error instanceof Error ? error.message : "Synchronisation locale Product Lab impossible.",
        });
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && localProductLabDecisionBridge(), mode === "development" && componentTagger()].filter(Boolean),
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": srcPath,
    },
  },
}));
