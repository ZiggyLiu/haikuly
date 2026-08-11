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
  const rscBootstrapPosition = html.indexOf("self.__VINEXT_RSC_CHUNKS__");
  const clientEntryPosition = html.indexOf('id="_R_"');
  assert.ok(rscBootstrapPosition >= 0);
  assert.ok(clientEntryPosition >= 0);
  assert.ok(rscBootstrapPosition < clientEntryPosition);
  assert.match(html, /<title>Stillpoint — Haiku Generator<\/title>/i);
  assert.match(html, /Three lines\./);
  assert.match(html, /One quiet world\./);
  assert.match(html, /By chance/);
  assert.match(html, /From a word/);
  assert.match(html, /English/);
  assert.match(html, /中文/);
  assert.match(html, /日本語/);
  assert.match(html, /5 · 7 · 5 syllables/);
  assert.match(html, /Write a haiku/);
  assert.match(html, /href="mailto:zhiguoinusa@gmail\.com"/);
  assert.match(html, />zhiguoinusa@gmail\.com</);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("includes both generator modes and removes starter assets", async () => {
  const [page, haiku, layout, packageJson, styles, inkWash] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/haiku.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/ink-wash.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(haiku, /type Mode = "random" \| "keyword"/);
  assert.match(haiku, /type Language = "en" \| "zh" \| "ja"/);
  assert.match(haiku, /countPoeticUnits/);
  assert.match(haiku, /estimateSyllables/);
  assert.doesNotMatch(haiku, /LOCAL_COMPOSITION_BANKS|makeRandomHaiku|makeKeywordHaiku/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /\/api\/haiku/);
  assert.match(haiku, /Written & painted with DeepSeek/);
  assert.match(page, /generationSourceLabel/);
  assert.match(page, /Written, reviewed, and painted with DeepSeek/);
  assert.match(page, /InkWashIllustration/);
  assert.match(inkWash, /<canvas/);
  assert.match(inkWash, /requestAnimationFrame/);
  assert.match(inkWash, /orientationchange/);
  assert.doesNotMatch(inkWash, /ResizeObserver/);
  assert.match(styles, /\.ink-wash-canvas/);
  assert.match(styles, /pointer-events:\s*none\s*!important/);
  assert.match(styles, /touch-action:\s*manipulation/);
  assert.match(styles, /\.poem-paper\.has-illustration \.poem-line p/);
  assert.match(page, /mode === "keyword"/);
  assert.match(page, /mode,/);
  assert.match(page, /language,/);
  assert.match(page, /Poem language/);
  assert.match(page, /随机生成/);
  assert.match(page, /关键词生成/);
  assert.match(page, /おまかせ/);
  assert.match(page, /言葉から/);
  assert.match(page, /俳句を保存/);
  assert.match(page, /俳句を詠む/);
  assert.match(page, /onClick=\{\(\) => changeLanguage\("ja"\)\}/);
  assert.ok(page.indexOf('className="language-control"') < page.indexOf('className="mode-switch"'));
  assert.match(page, /event\.persisted/);
  assert.match(page, /window\.location\.reload\(\)/);
  assert.doesNotMatch(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /Save Haiku/);
  assert.match(page, /Save haiku as a picture/);
  assert.match(page, /toDataURL\("image\/png"\)/);
  assert.match(page, /new File\(\[bytes\], filename/);
  assert.match(page, /navigator\.canShare\(shareData\)/);
  assert.match(page, /await navigator\.share\(shareData\)/);
  assert.match(page, /shareError\.name === "AbortError"/);
  assert.match(page, /link\.download = filename/);
  assert.match(page, /\.ink-wash-canvas/);
  assert.match(page, /paper-date/);
  assert.match(page, /haikuDateLabel/);
  assert.match(page, /Daily<br \/>Haiku/);
  assert.match(page, /sun-seal-label/);
  assert.match(page, /aria-label="Email Stillpoint at zhiguoinusa@gmail\.com"/);
  assert.match(page, /poemLinesClassName/);
  assert.doesNotMatch(page, /lineCounts/);
  assert.doesNotMatch(page, /title=\{displayed\?\.language === "zh" \? "characters" : "syllables"\}/);
  assert.match(page, /<span>5 · 7 · 5<\/span>/);
  assert.match(styles, /white-space:\s*nowrap/);
  assert.doesNotMatch(styles, /\.poem-line > span/);
  assert.match(styles, /\.poem-lines\.lines-extra-tight \.poem-line p/);
  assert.match(inkWash, /width \* 0\.36/);
  assert.match(inkWash, /width \* 0\.64/);
  assert.match(inkWash, /width \* 0\.72/);
  assert.match(styles, /\.page-shell::before \{ position: absolute; opacity: 0\.28; \}/);
  assert.match(styles, /\.ambient-left \{ width: 210px; height: 210px; left: -118px; top: 210px; \}/);
  assert.match(styles, /-webkit-transform:\s*translateZ\(0\)/);
  assert.match(styles, /\.sun-seal::after[\s\S]*background:\s*transparent/);
  assert.doesNotMatch(styles, /\.sun-seal::after[\s\S]{0,300}background:\s*var\(--rust\)/);
  assert.match(styles, /\.sun-seal-label[\s\S]*font-family:\s*var\(--font-geist-sans\), Arial, sans-serif/);
  assert.match(styles, /\.sun-seal-label[\s\S]*color:\s*rgba\(95, 105, 99, 0\.32\)/);
  assert.match(styles, /\.poem-line p[\s\S]*font-family:\s*var\(--font-geist-sans\)/);
  assert.match(styles, /\.poem-paper\.has-illustration \.poem-line p \{[\s\S]*?font-weight:\s*400/);
  assert.match(styles, /\.footer-contact/);
  assert.match(layout, /Stillpoint — Haiku Generator/);
  assert.match(layout, /RscBootstrap/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /summary_large_image/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL(".openai/hosting.json", projectRoot));
  await access(new URL("public/og.png", projectRoot));
  await access(new URL(".env.example", projectRoot));
});

test("keeps mobile Safari controls tappable and browser-compatible", async () => {
  const [styles, viteConfig] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /\.mode-switch button \{ min-width: 0; min-height: 44px;/);
  assert.match(styles, /\.language-switch button \{ min-height: 44px;/);
  assert.match(styles, /\.generate-button \{ grid-column: 1; grid-row: 1; width: 100%; min-height: 48px;/);
  assert.match(styles, /\.generator-form \{[\s\S]*?isolation: isolate;[\s\S]*?pointer-events: auto;/);
  assert.match(viteConfig, /target: "safari13"/);
});
