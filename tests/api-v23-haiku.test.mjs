import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/v23-haiku/route.ts";
import { isValidHaiku } from "../app/api/haiku/route.ts";

const strictLines = [
  "Moonlight fills the pines",
  "The river carries the sky",
  "A quiet bell rings",
];

const originalIllustration = {
  motif: "pine",
  accent: "moon",
  tone: "sage",
  placement: "right",
};

function deepSeekResult(value) {
  return Response.json({
    choices: [{
      finish_reason: "stop",
      message: { content: JSON.stringify(value) },
    }],
  });
}

function request(body) {
  return new Request("http://localhost/api/v23-haiku", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("version 23 keeps strict 5-7-5 validation and applies enriched content art", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.DEEPSEEK_API_KEY;
  context.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = originalKey;
  });
  process.env.DEEPSEEK_API_KEY = "test-key";

  let callCount = 0;
  globalThis.fetch = async () => {
    callCount += 1;
    if (callCount === 1) {
      return deepSeekResult({ lines: strictLines, illustration: originalIllustration });
    }
    return deepSeekResult({ verdict: "coherent", reason: "The scene is internally consistent." });
  };

  const response = await POST(request({
    mode: "keyword",
    language: "en",
    keyword: "last train",
  }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.version, 23);
  assert.equal(result.form, "5-7-5");
  assert.equal(isValidHaiku(result.haiku.lines, "en"), true);
  assert.deepEqual(result.haiku.lines, strictLines);
  assert.equal(result.haiku.illustration.motif, "transit");
  assert.notDeepEqual(result.haiku.illustration, originalIllustration);
  assert.equal(callCount, 2);
});

test("a complete strict-haiku line is accepted as keyword input", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.DEEPSEEK_API_KEY;
  context.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = originalKey;
  });
  process.env.DEEPSEEK_API_KEY = "test-key";

  let callCount = 0;
  globalThis.fetch = async () => {
    callCount += 1;
    return deepSeekResult(callCount === 1
      ? { lines: strictLines, illustration: originalIllustration }
      : { verdict: "coherent", reason: "The scene is internally consistent." });
  };

  const response = await POST(request({
    mode: "keyword",
    language: "en",
    keyword: "Moonlight fills the pines",
  }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.source, "deepseek");
  assert.equal(callCount, 2);
});
