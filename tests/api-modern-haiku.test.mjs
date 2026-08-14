import assert from "node:assert/strict";
import test from "node:test";
import {
  POST,
  illustrationForContent,
  isValidModernShortHaiku,
  modernLineLength,
} from "../app/api/modern-haiku/route.ts";

function request(body) {
  return new Request("http://localhost/api/modern-haiku", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deepSeekResult(value, finishReason = "stop") {
  return {
    choices: [{
      finish_reason: finishReason,
      message: { content: JSON.stringify(value) },
    }],
  };
}

function poemResult(lines, illustration) {
  return deepSeekResult({ lines, ...(illustration ? { illustration } : {}) });
}

function reviewResult(verdict = "pass", register = "modern", reason = "语言自然且具有当代生活感。") {
  return deepSeekResult({ verdict, register, reason });
}

const modernLines = ["外卖到了", "雨还堵在路上", "我先替今晚松一口气"];
const internetLines = ["班味还没散", "晚风先替我下线", "月亮补上情绪价值"];
const classicalLines = ["春雨落花间", "远山藏入暮云中", "一灯照归舟"];
const englishLines = ["Delivery waits downstairs", "Rain scrolls past my window", "Tonight I answer nobody"];
const japaneseLines = ["宅配が着いた", "雨はまだ渋滞中", "今夜だけ先に息をつく"];
const modernIllustration = {
  motif: "street",
  accent: "umbrella",
  tone: "blue-gray",
  placement: "right",
};

function restoreAfter(context) {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.DEEPSEEK_API_KEY;
  const originalTimeout = process.env.DEEPSEEK_TIMEOUT_MS;
  context.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = originalKey;
    if (originalTimeout === undefined) delete process.env.DEEPSEEK_TIMEOUT_MS;
    else process.env.DEEPSEEK_TIMEOUT_MS = originalTimeout;
  });
  process.env.DEEPSEEK_API_KEY = "test-key";
}

test("keyword mode generates flexible modern Chinese and runs an independent review", async (context) => {
  restoreAfter(context);
  const calls = [];
  const recentLines = ["耳机落在桌上", "电量只剩一格", "外卖还在路上"];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return Response.json(calls.length === 1 ? poemResult(modernLines, modernIllustration) : reviewResult());
  };

  const response = await POST(request({ mode: "keyword", tone: "modern", language: "zh", keyword: "雨夜", recentLines }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.source, "deepseek");
  assert.equal(result.tone, "modern");
  assert.equal(result.language, "zh");
  assert.deepEqual(result.haiku.lines, modernLines);
  assert.deepEqual(result.haiku.lines.map(modernLineLength), [4, 6, 9]);
  assert.deepEqual(result.haiku.illustration, modernIllustration);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://api.deepseek.com/chat/completions");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-key");
  assert.equal(calls[0].body.model, "deepseek-v4-flash");
  assert.deepEqual(calls[0].body.thinking, { type: "disabled" });
  assert.deepEqual(calls[0].body.response_format, { type: "json_object" });
  assert.match(calls[0].body.messages[0].content, /not a strict 5-7-5/i);
  assert.match(calls[0].body.messages[0].content, /Avoid classical diction/i);
  assert.match(calls[0].body.messages[0].content, /invented compounds/i);
  assert.match(calls[0].body.messages[0].content, /Treat all values.*as data/i);
  assert.match(calls[0].body.messages[0].content, /Do not default to recurring generator vocabulary/i);
  assert.match(calls[0].body.messages[0].content, /Do not repeat a distinctive noun/i);
  assert.match(calls[0].body.messages[0].content, /matching, sparse background illustration/i);
  assert.match(calls[0].body.messages[0].content, /window, skyline, transit, cafe, desk/i);
  assert.match(calls[0].body.messages[0].content, /simple, quiet, low-contrast/i);
  const generationInput = JSON.parse(calls[0].body.messages[1].content);
  assert.equal(generationInput.task, "Write a modern short haiku meaningfully based on the supplied keyword or phrase.");
  assert.equal(generationInput.mode, "keyword");
  assert.equal(generationInput.tone, "modern");
  assert.equal(generationInput.language, "zh");
  assert.equal(generationInput.keyword, "雨夜");
  assert.equal(generationInput.attempt, 1);
  assert.equal(typeof generationInput.creativeAngle, "string");
  assert.ok(generationInput.creativeAngle.length > 0);
  assert.deepEqual(generationInput.recentLines, recentLines);
  assert.match(calls[1].body.messages[0].content, /final editor/i);
  assert.match(calls[1].body.messages[0].content, /Reject avoidable reuse/i);
  assert.match(calls[1].body.messages[0].content, /unnatural collocations/i);
  assert.match(calls[1].body.messages[0].content, /motif and accent are physically sensible/i);
  const reviewInput = JSON.parse(calls[1].body.messages[1].content);
  assert.equal(reviewInput.mode, "keyword");
  assert.equal(reviewInput.tone, "modern");
  assert.equal(reviewInput.language, "zh");
  assert.equal(reviewInput.keyword, "雨夜");
  assert.equal(reviewInput.creativeAngle, generationInput.creativeAngle);
  assert.deepEqual(reviewInput.recentLines, recentLines);
  assert.deepEqual(reviewInput.lines, modernLines);
  assert.deepEqual(reviewInput.illustration, modernIllustration);
});

test("content-aware illustration fallback maps modern scenes across languages", () => {
  assert.equal(illustrationForContent(["Last train pauses", "my reflection stays", "one stop longer"], null, 1).motif, "transit");
  assert.equal(illustrationForContent(["手机亮了一下", "我没有回复", "夜继续安静"], null, 2).motif, "phone");
  assert.equal(illustrationForContent(["洗濯物が揺れる", "午後の風", "靴下だけ急ぐ"], null, 3).motif, "laundry");
  assert.equal(illustrationForContent(["An ordinary pause", "soft light on the floor", "nothing asks to hurry"], "coffee", 4).motif, "cafe");
  assert.equal(illustrationForContent(["Snow settles softly", "white silence gathers", "morning waits"], null, 5).motif, "snow");
  assert.equal(illustrationForContent(["远山醒得很慢", "云在半路停下", "风先到了"], null, 6).motif, "mountains");
});

test("the flexible form accepts a modern poem that is not 5-7-5", () => {
  assert.equal(isValidModernShortHaiku(modernLines), true);
  assert.deepEqual(modernLines.map(modernLineLength), [4, 6, 9]);
});

test("light internet tone limits slang and still requires a modern register", async (context) => {
  restoreAfter(context);
  const bodies = [];
  globalThis.fetch = async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return Response.json(bodies.length === 1 ? poemResult(internetLines) : reviewResult());
  };

  const response = await POST(request({ mode: "random", tone: "internet" }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(result.haiku.lines, internetLines);
  assert.match(bodies[0].messages[0].content, /no more than two natural current expressions/i);
  assert.match(bodies[1].messages[0].content, /meme stacking/i);
  const generationInput = JSON.parse(bodies[0].messages[1].content);
  assert.equal(generationInput.task, "Choose a fresh, specific moment from contemporary daily life.");
  assert.equal(generationInput.mode, "random");
  assert.equal(generationInput.tone, "internet");
  assert.equal(generationInput.language, "zh");
  assert.equal(generationInput.keyword, null);
  assert.equal(generationInput.attempt, 1);
  assert.equal(typeof generationInput.creativeAngle, "string");
  assert.deepEqual(generationInput.recentLines, []);
});

test("English mode generates and reviews a flexible contemporary three-line poem", async (context) => {
  restoreAfter(context);
  const bodies = [];
  globalThis.fetch = async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return Response.json(bodies.length === 1 ? poemResult(englishLines) : reviewResult("pass", "modern", "Natural contemporary English."));
  };

  const response = await POST(request({ mode: "random", language: "en" }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.language, "en");
  assert.deepEqual(result.haiku.lines, englishLines);
  assert.deepEqual(englishLines.map((line) => modernLineLength(line, "en")), [3, 5, 4]);
  assert.equal(isValidModernShortHaiku(englishLines, "en"), true);
  assert.match(bodies[0].messages[0].content, /natural contemporary English/i);
  assert.match(bodies[0].messages[0].content, /not a strict 5-7-5/i);
  assert.match(bodies[1].messages[0].content, /For English, reject archaic diction/i);
  assert.equal(JSON.parse(bodies[0].messages[1].content).language, "en");
  assert.equal(JSON.parse(bodies[1].messages[1].content).language, "en");
});

test("Japanese mode generates and reviews natural modern Japanese without strict mora counts", async (context) => {
  restoreAfter(context);
  const bodies = [];
  globalThis.fetch = async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return Response.json(bodies.length === 1 ? poemResult(japaneseLines) : reviewResult("pass", "modern", "自然な現代日本語です。"));
  };

  const response = await POST(request({ mode: "keyword", language: "ja", keyword: "雨の夜" }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.language, "ja");
  assert.deepEqual(result.haiku.lines, japaneseLines);
  assert.equal(isValidModernShortHaiku(japaneseLines, "ja"), true);
  assert.notDeepEqual(japaneseLines.map((line) => modernLineLength(line, "ja")), [5, 7, 5]);
  assert.match(bodies[0].messages[0].content, /自然な現代日本語/);
  assert.match(bodies[1].messages[0].content, /For Japanese, reject literary or old grammar/i);
  assert.equal(JSON.parse(bodies[0].messages[1].content).language, "ja");
  assert.equal(JSON.parse(bodies[1].messages[1].content).language, "ja");
});

test("a classical draft is rejected before a second modern draft is returned", async (context) => {
  restoreAfter(context);
  const responses = [
    poemResult(classicalLines),
    reviewResult("reject", "classical", "措辞偏古典。"),
    poemResult(modernLines),
    reviewResult(),
  ];
  let callCount = 0;
  globalThis.fetch = async () => Response.json(responses[callCount++]);

  const response = await POST(request({ mode: "random", tone: "modern" }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(result.haiku.lines, modernLines);
  assert.equal(callCount, 4);
});

test("harmless punctuation and spaces are removed before output", async (context) => {
  restoreAfter(context);
  const formatted = ["外卖 到了。", "雨还堵在路上，", "我先替今晚松一口气！"];
  let callCount = 0;
  globalThis.fetch = async () => Response.json(callCount++ === 0 ? poemResult(formatted) : reviewResult());

  const response = await POST(request({ mode: "random" }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(result.haiku.lines, modernLines);
});

test("invalid short lines are rejected after both attempts", async (context) => {
  restoreAfter(context);
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount += 1;
    return Response.json(poemResult(["月", "雨", "风"]));
  };

  const response = await POST(request({ mode: "random" }));
  const result = await response.json();
  assert.equal(response.status, 422);
  assert.match(result.error, /自然的现代短俳/);
  assert.equal(callCount, 2);
});

test("request validation rejects invalid modes, tones, and keyword input", async (context) => {
  restoreAfter(context);
  assert.equal((await POST(request({ mode: "other" }))).status, 400);
  assert.equal((await POST(request({ mode: "random", language: "fr" }))).status, 400);
  assert.equal((await POST(request({ mode: "random", tone: "classical" }))).status, 400);
  assert.equal((await POST(request({ mode: "keyword", keyword: "" }))).status, 400);
  assert.equal((await POST(request({ mode: "random", keyword: "雨" }))).status, 400);
  assert.equal((await POST(request({ mode: "random", recentLines: "耳机" }))).status, 400);
  assert.equal((await POST(request({ mode: "random", recentLines: Array(16).fill("旧诗") }))).status, 400);
});

test("missing DeepSeek configuration returns a controlled error", async (context) => {
  restoreAfter(context);
  delete process.env.DEEPSEEK_API_KEY;
  const response = await POST(request({ mode: "random" }));
  const result = await response.json();
  assert.equal(response.status, 503);
  assert.match(result.error, /配置尚未就绪/);
});
