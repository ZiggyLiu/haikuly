import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("routes subscription requests through the Cloudflare Worker", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("subscription-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const response = await worker.fetch(
    new Request("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ email: "not-an-email", language: "en", website: "" }),
    }),
    env,
    context,
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Enter a valid email address." });

  const oversizedResponse = await worker.fetch(
    new Request("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ email: "reader@example.com", language: "en", website: "x".repeat(5000) }),
    }),
    env,
    context,
  );
  assert.equal(oversizedResponse.status, 413);
});

test("modern short-haiku experiment uses the formal layout and DeepSeek service", async () => {
  const response = await render("/modern-test");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Haiku-ly/);
  assert.match(html, /English/);
  assert.match(html, /中文/);
  assert.match(html, /日本語/);
  assert.match(html, /Three lines · modern voice/);
  assert.match(html, /Write a modern haiku/);
  assert.match(html, /data-language="en"/);
  assert.match(html, /data-language="zh"/);
  assert.match(html, /data-language="ja"/);
  assert.match(html, /data-mode="random"/);
  assert.match(html, /data-mode="keyword"/);
  assert.match(html, /data-haiku-form="traditional"/);
  assert.match(html, /data-haiku-form="modern"/);
  assert.match(html, /5-7-5/);
  assert.match(html, /Modern Haiku/);
  assert.match(html, /Spring Whispers,/);
  assert.match(html, /data-version="26"/);
  assert.match(html, /id="poem-paper"/);
  assert.match(html, /id="generate-haiku"/);
  assert.match(html, /id="daily-subscription-form"/);
  assert.match(html, /id="subscription-email"/);
  assert.match(html, /id="subscription-timezone"/);
  assert.match(html, /Delivery timezone/);
  assert.match(html, /Send confirmation/);
  assert.match(html, /Your email is encrypted/);

  const [formalPage, modernPage, modernApi, v23Api, mobileRuntime, styles, inkWash] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/modern-test/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/modern-haiku/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/v23-haiku/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/mobile-runtime.js", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/ink-wash.tsx", import.meta.url), "utf8"),
  ]);
  const sharedLayoutClasses = [
    "page-shell", "ambient ambient-left", "ambient ambient-right", "site-header",
    "brand", "brand-mark", "header-note", "hero", "eyebrow", "intro", "studio",
    "language-control", "language-label", "language-switch", "language-rule",
    "mode-switch", "keyword-field", "input-wrap", "poem-paper", "sun-seal",
    "sun-seal-label", "poem-line", "poem-line-trigger", "line-menu", "paper-footer", "action-row", "error-message",
    "generate-button", "footer-meta", "footer-contact",
  ];
  for (const className of sharedLayoutClasses) {
    assert.ok(modernPage.includes(className), `modern page must contain ${className}`);
  }
  assert.match(formalPage, /export \{ default \} from "\.\/modern-test\/page";/);
  assert.match(modernPage, /isModernForm \? "\/api\/modern-haiku" : "\/api\/v23-haiku"/);
  assert.match(modernPage, /"\/api\/v23-haiku"/);
  assert.match(modernPage, /onClick=\{\(\) => changeLanguage\("en"\)\}/);
  assert.match(modernPage, /onClick=\{\(\) => changeLanguage\("zh"\)\}/);
  assert.match(modernPage, /onClick=\{\(\) => changeLanguage\("ja"\)\}/);
  assert.match(modernPage, /className="modern-generator-form"/);
  assert.match(modernPage, /data-language="en"/);
  assert.match(modernPage, /data-mode="keyword"/);
  assert.match(modernPage, /data-haiku-form="traditional"/);
  assert.match(modernPage, /data-haiku-form="modern"/);
  assert.match(modernPage, /onClick=\{\(\) => changeHaikuForm\("traditional"\)\}/);
  assert.match(modernPage, /onClick=\{\(\) => changeHaikuForm\("modern"\)\}/);
  assert.match(modernPage, /traditionalForm: "五七五俳句"/);
  assert.match(modernPage, /modernForm: "現代短俳"/);
  assert.match(modernPage, /heroTitle: "Spring Whispers,"/);
  assert.doesNotMatch(modernPage, /heroTitle: "Right now,"/);
  assert.match(modernPage, /document\.documentElement\.lang = languageTag\(language\)/);
  assert.match(modernPage, /homeAria: "Haiku-ly home"/);
  assert.match(modernPage, /homeAria: "返回 Haiku-ly 首页"/);
  assert.match(modernPage, /homeAria: "Haiku-ly ホームへ戻る"/);
  assert.match(modernPage, /emailAria: "Email Haiku-ly at zhiguoinusa@gmail\.com"/);
  assert.match(modernPage, /emailAria: "发送邮件至 zhiguoinusa@gmail\.com 联系 Haiku-ly"/);
  assert.match(modernPage, /emailAria: "zhiguoinusa@gmail\.com にメールで Haiku-ly へ連絡"/);
  assert.match(modernPage, /id="brand-home"[\s\S]*?aria-label=\{copy\.homeAria\}/);
  assert.match(modernPage, /id="footer-contact"[\s\S]*?aria-label=\{copy\.emailAria\}/);
  assert.doesNotMatch(modernPage, /实验页首页/);
  assert.match(modernPage, /id="keyword"/);
  assert.match(modernPage, /id="keyword-field"/);
  assert.match(modernPage, /id="poem-lines"/);
  assert.match(modernPage, /id="save-haiku"/);
  assert.match(modernPage, /id="error-message"/);
  assert.match(modernPage, /haikulyThis: "Haikuly this!"/);
  assert.match(modernPage, /haikulyThis: "以此句再作一首"/);
  assert.match(modernPage, /haikulyThis: "この句で詠む"/);
  assert.match(modernPage, /function haikulyThisLine\(index: number\)/);
  assert.match(modernPage, /void generate\(undefined, \{ mode: "keyword", language: haikuLanguage, keyword: line \}\)/);
  assert.match(modernPage, /function copyLineText\(index: number\)/);
  assert.match(modernPage, /document\.execCommand\("copy"\)/);
  assert.match(modernPage, /aria-haspopup="menu"/);
  assert.match(modernPage, /role="menuitem"/);
  assert.match(modernPage, /id="edit-haiku"/);
  assert.match(modernPage, /contentEditable/);
  assert.match(modernPage, /function editableLineUnitCount/);
  assert.match(modernPage, /displayedForm === "traditional"/);
  assert.match(modernPage, /humanEdited: "Human-edited"/);
  assert.match(modernPage, /humanEdited: "人工编辑"/);
  assert.match(modernPage, /humanEdited: "人間編集"/);
  assert.match(modernPage, /human-edited-badge/);
  assert.match(modernPage, /https:\/\/<br \/>haikuly\.fyi/);
  assert.match(styles, /\.poem-line-editing/);
  assert.match(styles, /\.poem-line-count/);
  assert.match(styles, /\.human-edited-badge/);
  assert.match(mobileRuntime, /data-line-input/);
  assert.match(mobileRuntime, /function editableLineUnits/);
  assert.match(mobileRuntime, /context\.fillText\("haikuly\.fyi"/);
  assert.match(modernPage, /__STILLPOINT_FALLBACK_ACTIVE__/);
  assert.match(modernPage, /recentLinesRef/);
  assert.match(modernPage, /recentLines: recentLinesRef\.current\[effectiveLanguage\]/);
  assert.match(modernPage, /isModernForm \? \{ recentLines:/);
  assert.match(modernPage, /const filename = haikuImageFilename\(haiku\.createdAt\);/);
  assert.match(modernPage, /await navigator\.share\(shareData\)/);
  assert.match(modernPage, /link\.download = filename/);
  assert.doesNotMatch(modernPage, /isAppleMobile|setSavePreview|save-preview|Touch and hold/);
  assert.match(mobileRuntime, /var prefix = "stillpoint-haiku";/);
  assert.match(mobileRuntime, /if \(!error \|\| error\.name !== "AbortError"\) downloadImage\(image\.dataUrl, name\);/);
  assert.doesNotMatch(mobileRuntime, /isAppleMobile|showImagePreview|save-preview/);
  assert.doesNotMatch(styles, /\.save-preview-/);
  assert.match(styles, /\.haiku-form-switch/);
  assert.match(modernApi, /const MODEL = "deepseek-v4-flash"/);
  assert.match(modernApi, /languageValue !== "en" && languageValue !== "zh" && languageValue !== "ja"/);
  assert.match(modernApi, /process\.env\.DEEPSEEK_API_KEY/);
  assert.match(modernApi, /https:\/\/api\.deepseek\.com\/chat\/completions/);
  assert.match(modernApi, /function illustrationForContent/);
  assert.match(modernApi, /"window", "skyline", "transit", "cafe", "desk"/);
  assert.match(modernApi, /Choose the motif and accent from a concrete image in the poem/);
  assert.match(inkWash, /recipe\.motif === "transit"/);
  assert.match(inkWash, /recipe\.motif === "phone"/);
  assert.match(inkWash, /recipe\.motif === "laundry"/);
  assert.match(inkWash, /recipe\.motif === "bicycle"/);
  assert.match(mobileRuntime, /motif === "transit"/);
  assert.match(mobileRuntime, /motif === "phone"/);
  assert.match(mobileRuntime, /motif === "laundry"/);
  assert.match(mobileRuntime, /motif === "bicycle"/);
  assert.match(v23Api, /generateStrictHaiku\(request\)/);
  assert.match(v23Api, /illustrationForContent\(result\.haiku\.lines, keyword, result\.haiku\.seed\)/);
  assert.match(v23Api, /form: "5-7-5"/);
  assert.match(v23Api, /version: 23/);
  assert.match(mobileRuntime, /state\.haikuForm === "modern" \? fetchModernHaiku\(payload\) : fetchV23Haiku\(payload\)/);
  assert.match(mobileRuntime, /fetch\("\/api\/v23-haiku"/);
  assert.match(mobileRuntime, /heroTitle: "Spring Whispers,"/);
  assert.match(mobileRuntime, /data-haiku-form/);
  assert.match(mobileRuntime, /document\.documentElement\.lang = state\.language === "zh" \? "zh-CN" : state\.language/);
  assert.match(mobileRuntime, /studio\.setAttribute\("aria-label", current\.pageTitle\)/);
  assert.match(mobileRuntime, /home\.setAttribute\("aria-label", current\.homeAria\)/);
  assert.match(mobileRuntime, /contact\.setAttribute\("aria-label", current\.emailAria\)/);
  assert.match(mobileRuntime, /homeAria: "返回 Haiku-ly 首页"/);
  assert.match(mobileRuntime, /emailAria: "zhiguoinusa@gmail\.com にメールで Haiku-ly へ連絡"/);
  assert.match(mobileRuntime, /function haikulyThisLine\(index\)/);
  assert.match(mobileRuntime, /state\.mode = "keyword"/);
  assert.match(mobileRuntime, /function copyLine\(index\)/);
  assert.match(mobileRuntime, /data-line-trigger/);
  assert.match(mobileRuntime, /data-line-haikuly/);
  assert.match(mobileRuntime, /data-line-copy/);
  assert.match(mobileRuntime, /\.modern-generator-form, \.generator-form/);
  assert.doesNotMatch(mobileRuntime, /Save modern short haiku as a picture|将现代短俳保存为图片|現代短俳を画像として保存/);
  await assert.rejects(access(new URL("../app/modern-test/modern-test.module.css", import.meta.url)));
});

test("server-renders the finished Stillpoint experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const linkHeader = response.headers.get("link") ?? "";
  assert.doesNotMatch(linkHeader, /\/Volumes\/|\/Users\//);
  assert.ok(linkHeader.length < 8192);

  const html = await response.text();
  assert.doesNotMatch(html, /\/Volumes\/|\/Users\//);
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
  const [rootPage, page, haiku, layout, packageJson, styles, inkWash, mobileRuntime, bootstrap, poemStyle] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/modern-test/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/haiku.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/ink-wash.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/mobile-runtime.js", import.meta.url), "utf8"),
    readFile(new URL("../app/rsc-bootstrap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/poem-style.ts", import.meta.url), "utf8"),
  ]);

  assert.match(rootPage, /export \{ default \} from "\.\/modern-test\/page";/);
  assert.match(haiku, /type Mode = "random" \| "keyword"/);
  assert.match(haiku, /type Language = "en" \| "zh" \| "ja"/);
  assert.match(haiku, /countPoeticUnits/);
  assert.match(haiku, /estimateSyllables/);
  assert.doesNotMatch(haiku, /LOCAL_COMPOSITION_BANKS|makeRandomHaiku|makeKeywordHaiku/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /\/api\/modern-haiku/);
  assert.match(page, /\/api\/v23-haiku/);
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
  assert.match(styles, /\.poem-line-trigger/);
  assert.match(styles, /\.line-menu/);
  assert.match(page, /mode === "keyword"/);
  assert.match(page, /mode,/);
  assert.match(page, /language,/);
  assert.match(page, /Poem language/);
  assert.match(page, /随机生成/);
  assert.match(page, /关键词生成/);
  assert.match(page, /おまかせ/);
  assert.match(page, /言葉から/);
  assert.match(page, /俳句を保存/);
  assert.match(page, /現代短俳を詠む/);
  assert.match(page, /五・七・五を詠む/);
  assert.match(page, /onClick=\{\(\) => changeLanguage\("ja"\)\}/);
  assert.match(page, /data-language="ja"/);
  assert.match(page, /data-mode="keyword"/);
  assert.match(page, /id="modern-short-haiku-app"/);
  assert.match(page, /id="generate-haiku"/);
  assert.match(page, /__STILLPOINT_REACT_READY__/);
  assert.match(page, /useLayoutEffect/);
  assert.match(page, /__STILLPOINT_FALLBACK_ACTIVE__/);
  assert.ok(page.indexOf('className="language-control"') < page.indexOf('className="mode-switch"'));
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
  assert.match(page, /https:\/\/<br \/>haikuly\.fyi/);
  assert.match(page, /Node\.TEXT_NODE/);
  assert.match(page, /labelLines\[0\]\.trim\(\)/);
  assert.doesNotMatch(page, /"Daily"/);
  assert.match(page, /sun-seal-label/);
  assert.match(page, /aria-label=\{copy\.emailAria\}/);
  assert.match(page, /poemLinesClassName/);
  assert.doesNotMatch(page, /lineCounts/);
  assert.doesNotMatch(page, /title=\{displayed\?\.language === "zh" \? "characters" : "syllables"\}/);
  assert.match(page, /<span id="paper-rule">\{formCopy\.paperRule\}<\/span>/);
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
  assert.match(styles, /\.poem-line p[\s\S]*font-family:\s*var\(--poem-font/);
  assert.match(styles, /@font-face[\s\S]*font-family:\s*"DouyinSans"[\s\S]*DouyinSansBold\.ttf/);
  assert.match(styles, /font-family:\s*"Haikuly WenKai"[\s\S]*LXGWWenKaiLite-Regular\.ttf/);
  assert.match(styles, /font-family:\s*"Haikuly Source Han Serif"[\s\S]*SourceHanSerifCN-VF\.woff2/);
  assert.match(styles, /font-family:\s*"Haikuly Source Han Sans"[\s\S]*SourceHanSansCN-VF\.woff2/);
  assert.match(styles, /font-family:\s*"Haikuly Smiley Sans"[\s\S]*SmileySans-Oblique\.woff2/);
  assert.match(styles, /\.poem-lines\[lang="zh-CN"\] \.poem-line p[\s\S]*font-family:\s*var\(--poem-font/);
  assert.match(styles, /\.poem-lines\[lang="ja"\] \.poem-line p[\s\S]*font-family:\s*var\(--poem-font/);
  assert.match(page, /id="haiku-edit-panel"/);
  assert.match(page, /data-poem-style="fontSize"/);
  assert.match(page, /data-poem-style="lineHeight"/);
  assert.match(page, /data-poem-style="illustrationOpacity"/);
  assert.doesNotMatch(page, /href="\/font-tester"/);
  assert.match(poemStyle, /POEM_STYLE_STORAGE_KEY/);
  assert.match(poemStyle, /id: "wenkai"/);
  assert.match(poemStyle, /id: "source-han-serif"/);
  assert.match(poemStyle, /id: "source-han-sans"/);
  assert.match(poemStyle, /id: "smiley-sans"/);
  assert.match(poemStyle, /LEGACY_CHINESE_FONT_IDS/);
  assert.match(poemStyle, /hannotate: "wenkai"/);
  assert.match(poemStyle, /fangsong: "source-han-serif"/);
  assert.match(poemStyle, /harmonyos: "source-han-sans"/);
  assert.match(poemStyle, /pingfang: "source-han-sans"/);
  assert.match(poemStyle, /id: "cormorant"/);
  assert.match(poemStyle, /id: "dancing"/);
  assert.match(poemStyle, /id: "shippori"/);
  assert.match(poemStyle, /id: "hiragino-sans"/);
  const chineseFonts = poemStyle.match(/zh:\s*\[([\s\S]*?)\],\s*ja:/)?.[1] ?? "";
  const englishFonts = poemStyle.match(/en:\s*\[([\s\S]*?)\],\s*zh:/)?.[1] ?? "";
  const japaneseFonts = poemStyle.match(/ja:\s*\[([\s\S]*?)\],\s*};/)?.[1] ?? "";
  assert.equal((chineseFonts.match(/id:\s*"/g) ?? []).length, 4);
  assert.equal((englishFonts.match(/id:\s*"/g) ?? []).length, 5);
  assert.equal((japaneseFonts.match(/id:\s*"/g) ?? []).length, 5);
  await assert.rejects(access(new URL("../app/font-tester/page.tsx", import.meta.url)));
  assert.match(mobileRuntime, /POEM_STYLE_STORAGE_KEY/);
  assert.match(mobileRuntime, /data-poem-font/);
  assert.match(layout, /Cormorant_Garamond/);
  assert.doesNotMatch(layout, /Liu_Jian_Mao_Cao/);
  assert.match(layout, /Shippori_Mincho/);
  assert.match(page, /document\.fonts\.load/);
  assert.match(page, /document\.fonts\.ready/);
  assert.match(mobileRuntime, /document\.fonts\.load/);
  assert.match(mobileRuntime, /document\.fonts\.ready/);
  assert.match(styles, /\.poem-paper\.has-illustration \.poem-line p \{[\s\S]*?font-weight:\s*400/);
  assert.match(styles, /\.footer-contact/);
  assert.match(styles, /\.subscription-section/);
  assert.match(styles, /\.subscription-timezone-field/);
  assert.match(styles, /\.subscription-honeypot/);
  assert.match(page, /fetch\("\/api\/subscribe"/);
  assert.match(page, /language: submittedLanguage/);
  assert.match(page, /timezone: subscriptionTimezone/);
  assert.match(page, /subscriptionTitle: "每日一首，寄到邮箱"/);
  assert.match(page, /subscriptionTitle: "毎日一篇をメールで"/);
  assert.match(mobileRuntime, /function subscribeDaily\(form\)/);
  assert.match(mobileRuntime, /form\.id === "daily-subscription-form"/);
  assert.match(layout, /Spring Whispers, Haiku-ly~/);
  assert.match(layout, /strict 5–7–5 haiku or a modern three-line haiku/);
  assert.match(layout, /Haiku-ly — Three lines\. One quiet world\./);
  assert.doesNotMatch(layout, /Stillpoint — Three lines/);
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
  assert.match(mobileRuntime, /function isModernApp\(\)/);
  assert.match(mobileRuntime, /fetch\("\/api\/modern-haiku"/);
  assert.match(mobileRuntime, /form\.classList\.contains\("modern-generator-form"\)/);
  assert.match(mobileRuntime, /isModernApp\(\) \? MODERN_COPY : COPY/);
  assert.match(mobileRuntime, /recentLines: \{ en: \[\], zh: \[\], ja: \[\] \}/);
  assert.match(mobileRuntime, /payload\.recentLines = state\.recentLines\[state\.language\]/);
  assert.match(mobileRuntime, /navigator\.canShare\(shareData\)/);
  assert.match(mobileRuntime, /navigator\.share\(shareData\)/);
  assert.match(mobileRuntime, /drawInk\(canvas, haiku\)/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /summary_large_image/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await assert.rejects(access(new URL(".openai/hosting.json", projectRoot)));
  await assert.rejects(access(new URL("build/sites-vite-plugin.ts", projectRoot)));
  await access(new URL("public/og.png", projectRoot));
  await access(new URL("public/fonts/DouyinSansBold.ttf", projectRoot));
  await access(new URL("public/fonts/OFL.txt", projectRoot));
  await access(new URL("public/fonts/chinese/LXGWWenKaiLite-Regular.ttf", projectRoot));
  await access(new URL("public/fonts/chinese/SourceHanSerifCN-VF.woff2", projectRoot));
  await access(new URL("public/fonts/chinese/SourceHanSansCN-VF.woff2", projectRoot));
  await access(new URL("public/fonts/chinese/SmileySans-Oblique.woff2", projectRoot));
  await access(new URL("public/fonts/licenses/LXGW-WenKai-Lite-OFL.txt", projectRoot));
  await access(new URL("public/fonts/licenses/Source-Han-OFL.txt", projectRoot));
  await access(new URL("public/fonts/licenses/Smiley-Sans-OFL.txt", projectRoot));
  await access(new URL(".env.example", projectRoot));
});

test("keeps mobile Safari controls tappable and browser-compatible", async () => {
  const [styles, viteConfig, nextConfig] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /\.mode-switch button \{ min-width: 0; min-height: 44px;/);
  assert.match(styles, /\.language-switch button \{ min-height: 44px;/);
  assert.match(styles, /\.haiku-form-switch button \{ min-width: 0; min-height: 44px; flex: 1; \}/);
  assert.match(styles, /\.generate-button \{ grid-column: 1; grid-row: 1; width: 100%; min-height: 48px;/);
  assert.match(styles, /\.generator-form \{[\s\S]*?isolation: isolate;[\s\S]*?pointer-events: auto;/);
  assert.match(styles, /\.ink-wash-canvas \{[\s\S]*?top:\s*0;[\s\S]*?right:\s*0;[\s\S]*?bottom:\s*0;[\s\S]*?left:\s*0;[\s\S]*?inset:\s*0;/);
  assert.match(styles, /\.brand > \* \+ \* \{ margin-left: 12px; \}/);
  assert.match(styles, /\.footer-meta > \* \+ \* \{ margin-left: 22px; \}/);
  assert.match(viteConfig, /target: "safari13"/);
  assert.match(nextConfig, /allowedDevOrigins: \["192\.168\.12\.112"\]/);
});
