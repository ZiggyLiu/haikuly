import assert from "node:assert/strict";
import test from "node:test";
import { POST, isValidHaiku } from "../app/api/haiku/route.ts";
import { estimateSyllables } from "../app/haiku.ts";

function request(keyword) {
  return new Request("http://localhost/api/haiku", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword }),
  });
}

function rawRequest(value) {
  return new Request("http://localhost/api/haiku", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

function openAIResult(lines) {
  return {
    output: [
      {
        content: [
          { type: "output_text", text: JSON.stringify({ lines }) },
        ],
      },
    ],
  };
}

test("the API accepts a valid OpenAI haiku", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  context.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  process.env.OPENAI_API_KEY = "test-key";
  let requestBody;
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return Response.json(openAIResult([
      "Moonlight fills the pines",
      "The river carries the sky",
      "A quiet bell rings",
    ]));
  };

  const response = await POST(request("moonlight"));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.source, "openai");
  assert.deepEqual(result.haiku.lines.map(estimateSyllables), [5, 7, 5]);
  assert.equal(requestBody.model, "gpt-5.6-luna");
  assert.equal(requestBody.store, false);
  assert.equal(requestBody.text.format.type, "json_schema");
});

test("the API uses the safe local fallback for invalid model output", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  context.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async () => Response.json(openAIResult(["Too short", "Also short", "No"]));

  const response = await POST(request("ocean"));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.source, "local-fallback");
  assert.deepEqual(result.haiku.lines.map(estimateSyllables), [5, 7, 5]);
});

test("the API uses the safe local fallback when OpenAI is unavailable", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  context.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async () => Response.json(
    { error: { type: "insufficient_quota" } },
    { status: 429 },
  );

  const response = await POST(request("moon"));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.source, "local-fallback");
  assert.deepEqual(result.haiku.lines.map(estimateSyllables), [5, 7, 5]);
});

test("the API falls back for transport errors and malformed OpenAI JSON", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  context.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  process.env.OPENAI_API_KEY = "test-key";
  for (const fetchResult of [
    async () => { throw new TypeError("network down"); },
    async () => new Response("not-json", { status: 200 }),
  ]) {
    globalThis.fetch = fetchResult;
    const response = await POST(request("autumn wind"));
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.source, "local-fallback");
    assert.deepEqual(result.haiku.lines.map(estimateSyllables), [5, 7, 5]);
  }
});

test("the API times out a stalled OpenAI request and falls back", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalTimeout = process.env.OPENAI_TIMEOUT_MS;
  context.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalTimeout === undefined) delete process.env.OPENAI_TIMEOUT_MS;
    else process.env.OPENAI_TIMEOUT_MS = originalTimeout;
  });

  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_TIMEOUT_MS = "5";
  globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });

  const response = await POST(request("winter"));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.source, "local-fallback");
  assert.deepEqual(result.haiku.lines.map(estimateSyllables), [5, 7, 5]);
});

test("the API validates input and falls back when OpenAI is not configured", async (context) => {
  const originalKey = process.env.OPENAI_API_KEY;
  context.after(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  process.env.OPENAI_API_KEY = "test-key";
  assert.equal((await POST(request(""))).status, 400);
  assert.equal((await POST(request("x".repeat(49)))).status, 400);
  delete process.env.OPENAI_API_KEY;
  const response = await POST(request("rain"));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.source, "local-fallback");
  assert.deepEqual(result.haiku.lines.map(estimateSyllables), [5, 7, 5]);
});

test("the API controls malformed JSON values", async () => {
  for (const value of [null, [], 7, true, {}, { keyword: null }, { keyword: ["rain"] }]) {
    const response = await POST(rawRequest(value));
    assert.equal(response.status, 400, JSON.stringify(value));
  }
});

test("every accepted phrase has a verified fallback", async (context) => {
  const originalKey = process.env.OPENAI_API_KEY;
  context.after(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });
  delete process.env.OPENAI_API_KEY;

  const accepted = [
    "rain",
    "artificial intelligence",
    "moonlight!!!",
    "  first     snow  ",
    "a very long thought about a quiet summer garden",
    "x".repeat(48),
  ];
  for (const keyword of accepted) {
    const response = await POST(request(keyword));
    const result = await response.json();
    assert.equal(response.status, 200, keyword);
    assert.equal(result.source, "local-fallback", keyword);
    assert.deepEqual(result.haiku.lines.map(estimateSyllables), [5, 7, 5], keyword);
  }
});

test("haiku validation enforces exactly 5–7–5", () => {
  assert.equal(isValidHaiku(["Moonlight fills the pines", "The river carries the sky", "A quiet bell rings"]), true);
  assert.equal(isValidHaiku(["Too short", "The river carries the sky", "A quiet bell rings"]), false);
  assert.equal(isValidHaiku(["Moonlight fills the pines"]), false);
});
