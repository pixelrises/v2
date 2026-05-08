#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { trustedResearchSources, redactSecrets } from "./product-lab-core.mjs";

const timeoutMs = Number(process.env.PRODUCT_LAB_RESEARCH_TIMEOUT_MS || 7000);
const stateDir = path.join(process.cwd(), "product-lab", "state");
const outputPath = path.join(stateDir, "research-sources.json");

const verifySource = async (source) => {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(source.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Pixelrises-Product-Lab/1.0 (+https://github.com/pixelrises/v2)",
      },
    });

    return {
      id: source.id,
      name: source.name,
      url: source.url,
      status: response.ok ? "verified" : "unavailable",
      httpStatus: response.status,
      durationMs: Date.now() - startedAt,
      verifiedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      id: source.id,
      name: source.name,
      url: source.url,
      status: "unavailable",
      httpStatus: null,
      durationMs: Date.now() - startedAt,
      verifiedAt: new Date().toISOString(),
      error: redactSecrets(error?.message ?? "verification failed"),
    };
  } finally {
    clearTimeout(timeout);
  }
};

const results = await Promise.all(trustedResearchSources.map(verifySource));
const resultsById = Object.fromEntries(results.map((result) => [result.id, result]));
const verifiedCount = results.filter((result) => result.status === "verified").length;
const payload = {
  mode: "live",
  verifiedAt: new Date().toISOString(),
  total: results.length,
  verifiedCount,
  results: resultsById,
};

fs.mkdirSync(stateDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");

console.log(`Product Lab research verification: ${verifiedCount}/${results.length} sources verified`);
