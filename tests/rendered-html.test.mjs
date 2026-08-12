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
  const criticalStylesPosition = html.indexOf("data-stillpoint-critical");
  const inlineRuntimePosition = html.indexOf("data-stillpoint-runtime");
  const inlineReadyPosition = html.indexOf("__STILLPOINT_INLINE_READY__");
  const clientEntryPosition = html.indexOf('id="_R_"');
  assert.ok(rscBootstrapPosition >= 0);
  assert.ok(criticalStylesPosition >= 0);
  assert.ok(inlineRuntimePosition >= 0);
  assert.ok(inlineReadyPosition >= 0);
  assert.ok(clientEntryPosition >= 0);
  assert.ok(rscBootstrapPosition < clientEntryPosition);
  assert.ok(criticalStylesPosition < clientEntryPosition);
  assert.ok(inlineRuntimePosition < clientEntryPosition);
  assert.ok(inlineReadyPosition < clientEntryPosition);
  assert.equal((html.match(/data-stillpoint-critical/g) ?? []).length, 1);
  assert.equal((html.match(/data-stillpoint-runtime/g) ?? []).length, 1);
  assert.match(html, /data-stillpoint-critical="true"[^>]*>[^<]*\.page-shell/);
  assert.match(html, /data-stillpoint-runtime="true"/);
  assert.match(html, /<title>Spring Whispers, Haiku-ly~<\/title>/i);
  assert.match(html, /Spring Whispers,/);
  assert.match(html, /<em id="hero-accent">Haiku-ly~<\/em>/);
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
  const [page, haiku, layout, packageJson, styles, inkWash, mobileRuntime, bootstrap] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/haiku.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/ink-wash.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/mobile-runtime.js", import.meta.url), "utf8"),
    readFile(new URL("../app/rsc-bootstrap.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(haiku, /type Mode = "random" \| "keyword"/);
  assert.match(haiku, /type Language = "en" \| "zh" \| "ja"/);
  assert.match(haiku, /countPoeticUnits/);
  assert.match(haiku, /estimateSyllables/);
  assert.doesNotMatch(haiku, /LOCAL_COMPOSITION_BANKS|makeRandomHaiku|makeKeywordHaiku/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /\/api\/haiku/);
  assert.doesNotMatch(haiku, /Written & painted with DeepSeek/);
  assert.doesNotMatch(page, /generationSourceLabel/);
  assert.doesNotMatch(page, /Written, reviewed, and painted with DeepSeek/);
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
  assert.match(page, /data-language="ja"/);
  assert.match(page, /data-mode="keyword"/);
  assert.match(page, /id="stillpoint-app"/);
  assert.match(page, /id="generate-haiku"/);
  assert.match(page, /__STILLPOINT_REACT_READY__/);
  assert.match(page, /useLayoutEffect/);
  assert.match(page, /__STILLPOINT_FALLBACK_ACTIVE__/);
  assert.match(page, /readFallbackSnapshot/);
  assert.match(page, /__STILLPOINT_FALLBACK_STATE__/);
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
  assert.match(page, /Haiku-<br \/>ly/);
  assert.match(page, /fillText\("Haiku-"/);
  assert.match(page, /fillText\("ly"/);
  assert.doesNotMatch(page, /"Daily"/);
  assert.match(page, /sun-seal-label/);
  assert.match(page, /aria-label="Email Haiku-ly at zhiguoinusa@gmail\.com"/);
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
  assert.match(layout, /Spring Whispers, Haiku-ly~/);
  assert.match(layout, /RscBootstrap/);
  assert.match(bootstrap, /globals\.css\?raw/);
  assert.match(bootstrap, /mobile-runtime\.js\?raw/);
  assert.match(bootstrap, /data-stillpoint-critical/);
  assert.match(bootstrap, /data-stillpoint-runtime/);
  assert.match(mobileRuntime, /document\.addEventListener\("click"/);
  assert.match(mobileRuntime, /document\.addEventListener\("submit"/);
  assert.match(mobileRuntime, /function activateFallback\(\)/);
  assert.match(mobileRuntime, /activateFallback\(\);/);
  assert.match(mobileRuntime, /__STILLPOINT_FALLBACK_ACTIVE__ !== true/);
  assert.match(mobileRuntime, /function publishState\(\)/);
  assert.match(mobileRuntime, /__STILLPOINT_FALLBACK_STATE__/);
  assert.match(mobileRuntime, /fetch\("\/api\/haiku"/);
  assert.match(mobileRuntime, /navigator\.canShare\(shareData\)/);
  assert.match(mobileRuntime, /navigator\.share\(shareData\)/);
  assert.match(mobileRuntime, /drawInk\(canvas, haiku\)/);
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
  assert.match(styles, /\.ink-wash-canvas \{[\s\S]*?top:\s*0;[\s\S]*?right:\s*0;[\s\S]*?bottom:\s*0;[\s\S]*?left:\s*0;[\s\S]*?inset:\s*0;/);
  assert.match(styles, /\.brand > \* \+ \* \{ margin-left: 12px; \}/);
  assert.match(styles, /\.footer-meta > \* \+ \* \{ margin-left: 22px; \}/);
  assert.match(viteConfig, /target: "safari13"/);
});
