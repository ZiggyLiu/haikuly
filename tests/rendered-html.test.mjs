import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished Stillpoint experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Stillpoint — Haiku Generator<\/title>/i);
  assert.match(html, /Three lines\./);
  assert.match(html, /One quiet world\./);
  assert.match(html, /By chance/);
  assert.match(html, /From a word/);
  assert.match(html, /Write a haiku/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("includes both generator modes and removes starter assets", async () => {
  const [page, haiku, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/haiku.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(haiku, /type Mode = "random" \| "keyword"/);
  assert.match(haiku, /estimateSyllables/);
  assert.doesNotMatch(haiku, /LOCAL_COMPOSITION_BANKS|makeRandomHaiku|makeKeywordHaiku/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /\/api\/haiku/);
  assert.match(haiku, /Written with DeepSeek/);
  assert.match(page, /generationSourceLabel/);
  assert.match(page, /Written and reviewed by DeepSeek/);
  assert.match(page, /mode === "keyword"/);
  assert.match(page, /mode,/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(layout, /Stillpoint — Haiku Generator/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /summary_large_image/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL(".openai/hosting.json", projectRoot));
  await access(new URL("public/og.png", projectRoot));
  await access(new URL(".env.example", projectRoot));
});
