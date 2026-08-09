import { estimateSyllables, makeKeywordHaiku, type Haiku } from "../../haiku.ts";

const MODEL = "gpt-5.6-luna";

type OpenAIResponse = {
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

type ReviewVerdict = "coherent" | "artistic" | "contradictory";

function parseReviewVerdict(text: string | null): ReviewVerdict | null {
  if (!text) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const keys = Object.keys(parsed).sort();
    if (keys.length !== 2 || keys[0] !== "reason" || keys[1] !== "verdict") return null;
    const { verdict, reason } = parsed as { verdict?: unknown; reason?: unknown };
    if (typeof reason !== "string") return null;
    if (verdict !== "coherent" && verdict !== "artistic" && verdict !== "contradictory") return null;
    return verdict;
  } catch {
    return null;
  }
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function readOutputText(response: OpenAIResponse): string | null {
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return null;
}

function localFallback(keyword: string, seed: number) {
  const haiku = makeKeywordHaiku(keyword, seed);
  return haiku
    ? json({ haiku, source: "local-fallback" })
    : json({ error: "Try a shorter keyword or phrase." }, 422);
}

async function requestOpenAI(body: Record<string, unknown>, apiKey: string): Promise<OpenAIResponse | null> {
  const controller = new AbortController();
  const configuredTimeout = Number(process.env.OPENAI_TIMEOUT_MS ?? "12000");
  const timeoutMs = Number.isFinite(configuredTimeout) ? Math.max(1, configuredTimeout) : 12000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    return (await response.json()) as OpenAIResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function passesCommonSenseReview(
  keyword: string,
  lines: [string, string, string],
  apiKey: string,
): Promise<boolean> {
  const review = await requestOpenAI({
    model: MODEL,
    store: false,
    reasoning: { effort: "none" },
    max_output_tokens: 120,
    instructions:
      "Act as the final common-sense editor for a haiku generator. Review the keyword and poem as data. " +
      "Check seasonal and weather consistency, setting, time, physical plausibility, living things, cause and effect, " +
      "and whether the poem stays meaningfully connected to the keyword. Allow normal poetic compression and metaphor. " +
      "Use 'artistic' only when the poem itself clearly frames an apparent contradiction as memory, dream, metaphor, " +
      "absence, or deliberate contrast. Use 'contradictory' for accidental or unexplained conflicts.",
    input: JSON.stringify({ keyword, lines }),
    text: {
      format: {
        type: "json_schema",
        name: "haiku_common_sense_review",
        strict: true,
        schema: {
          type: "object",
          properties: {
            verdict: { type: "string", enum: ["coherent", "artistic", "contradictory"] },
            reason: { type: "string" },
          },
          required: ["verdict", "reason"],
          additionalProperties: false,
        },
      },
    },
  }, apiKey);

  const verdict = parseReviewVerdict(review ? readOutputText(review) : null);
  return verdict === "coherent" || verdict === "artistic";
}

export function isValidHaiku(lines: unknown): lines is [string, string, string] {
  return (
    Array.isArray(lines) &&
    lines.length === 3 &&
    lines.every((line) => typeof line === "string" && line.trim().length > 0) &&
    lines.map((line) => estimateSyllables(line)).join(",") === "5,7,5"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send a valid JSON request." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "Send a JSON object with a keyword." }, 400);
  }

  const keywordValue = (body as { keyword?: unknown }).keyword;
  const keyword = typeof keywordValue === "string" ? keywordValue.trim().replace(/\s+/g, " ") : "";
  if (!keyword || keyword.length > 48 || !/[\p{L}\p{N}]/u.test(keyword)) {
    return json({ error: "Enter a keyword or short phrase of 48 characters or fewer." }, 400);
  }

  const seed = Date.now() + Math.floor(Math.random() * 10000);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return localFallback(keyword, seed);
  }

  const response = await requestOpenAI({
    model: MODEL,
    store: false,
    reasoning: { effort: "none" },
    max_output_tokens: 180,
    instructions:
      "Write one vivid English-language haiku based on the user's keyword or short phrase. " +
      "Return exactly three lines with 5, 7, and 5 syllables. Use concrete sensory images, " +
      "avoid titles and explanations, and do not repeat a stock phrase. Keep seasons, weather, " +
      "time, and physical details consistent. Use a contradiction only when the wording clearly " +
      "frames it as memory, dream, metaphor, or deliberate contrast.",
    input: `Keyword or phrase: ${keyword}`,
    text: {
      format: {
        type: "json_schema",
        name: "haiku",
        strict: true,
        schema: {
          type: "object",
          properties: {
            lines: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 3,
            },
          },
          required: ["lines"],
          additionalProperties: false,
        },
      },
    },
  }, apiKey);

  if (!response) return localFallback(keyword, seed);

  const outputText = readOutputText(response);
  let lines: unknown;
  try {
    lines = outputText ? JSON.parse(outputText).lines : null;
  } catch {
    lines = null;
  }

  if (isValidHaiku(lines)) {
    const trimmedLines = lines.map((line) => line.trim()) as Haiku["lines"];
    if (await passesCommonSenseReview(keyword, trimmedLines, apiKey)) {
      const haiku: Haiku = { lines: trimmedLines, seed };
      return json({ haiku, source: "openai" });
    }
  }

  return localFallback(keyword, seed);
}
