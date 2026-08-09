import { estimateSyllables, makeKeywordHaiku, type Haiku } from "../../haiku.ts";

const MODEL = "gpt-5.6-luna";

type OpenAIResponse = {
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

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

  const controller = new AbortController();
  const configuredTimeout = Number(process.env.OPENAI_TIMEOUT_MS ?? "12000");
  const timeoutMs = Number.isFinite(configuredTimeout) ? Math.max(1, configuredTimeout) : 12000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: OpenAIResponse;

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        reasoning: { effort: "none" },
        max_output_tokens: 180,
        instructions:
          "Write one vivid English-language haiku based on the user's keyword or short phrase. " +
          "Return exactly three lines with 5, 7, and 5 syllables. Use concrete sensory images, " +
          "avoid titles and explanations, and do not repeat a stock phrase.",
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
      }),
    });

    if (!openAIResponse.ok) return localFallback(keyword, seed);
    response = (await openAIResponse.json()) as OpenAIResponse;
  } catch {
    return localFallback(keyword, seed);
  } finally {
    clearTimeout(timeout);
  }

  const outputText = readOutputText(response);
  let lines: unknown;
  try {
    lines = outputText ? JSON.parse(outputText).lines : null;
  } catch {
    lines = null;
  }

  if (isValidHaiku(lines)) {
    const haiku: Haiku = { lines: lines.map((line) => line.trim()) as Haiku["lines"], seed };
    return json({ haiku, source: "openai" });
  }

  return localFallback(keyword, seed);
}
