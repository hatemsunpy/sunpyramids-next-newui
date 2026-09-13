import { getTripTaxonomy } from "@/lib/data";
import { isLocale } from "@/lib/locales";
import { headerVoiceResolution } from "@/lib/header-voice-resolution";
import { parseVoiceQuery } from "@/lib/voice/parse-voice-query";
import { mapCapabilities } from "@/lib/voice/capability-mapper";
import type { Locale } from "@/types/api";

const MAX_BODY_BYTES = 8192;
const MAX_TRANSCRIPT_LENGTH = 1000;

function jsonResponse(payload: unknown, status = 200) {
  return Response.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

async function boundedBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("missing-body");
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("body-too-large");
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

function validInput(body: unknown): body is { transcript: string; locale: Locale } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  if (Object.keys(body).some((key) => key !== "transcript" && key !== "locale")) return false;
  const { transcript, locale } = body as { transcript?: unknown; locale?: unknown };
  return typeof locale === "string" && isLocale(locale)
    && typeof transcript === "string" && Boolean(transcript.trim())
    && transcript.length <= MAX_TRANSCRIPT_LENGTH;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return jsonResponse({ error: "invalid-origin" }, 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return jsonResponse({ error: "invalid-input" }, 415);
  }
  let body: unknown;
  try {
    body = await boundedBody(request);
  } catch {
    return jsonResponse({ error: "invalid-input" }, 400);
  }
  if (!validInput(body)) return jsonResponse({ error: "invalid-input" }, 400);
  const { transcript, locale } = body;
  try {
    const intent = parseVoiceQuery(transcript.trim(), locale);
    const taxonomy = await getTripTaxonomy(locale);
    // Existing taxonomy aggregates do not expose per-endpoint failures. An
    // absent required entity source must not masquerade as a title fallback.
    if (!taxonomy.destinations.length || (intent.category?.hints.length && !taxonomy.rootCategories.length)) {
      return jsonResponse({ error: "resolution-unavailable" }, 503);
    }
    return jsonResponse(headerVoiceResolution(mapCapabilities(intent, taxonomy), taxonomy));
  } catch {
    return jsonResponse({ error: "resolution-unavailable" }, 503);
  }
}
