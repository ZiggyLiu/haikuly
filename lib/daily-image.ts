import type { Language } from "../app/haiku";

export const DAILY_IMAGE_RENDERER_VERSION = "v1";

export function dailyImageObjectKey(sendDate: string, language: Language): string {
  return `daily/${DAILY_IMAGE_RENDERER_VERSION}/${sendDate}/${language}.png`;
}

export function dailyImageUrl(baseUrl: string, sendDate: string, language: Language): string {
  return `${baseUrl.replace(/\/+$/g, "")}/daily-images/${encodeURIComponent(sendDate)}/${language}.png`;
}

export function dailyImageDownloadUrl(baseUrl: string, sendDate: string, language: Language): string {
  return `${dailyImageUrl(baseUrl, sendDate, language)}?download=1`;
}

export function dailyCardUrl(baseUrl: string, sendDate: string, language: Language): string {
  return `${baseUrl.replace(/\/+$/g, "")}/daily-card?date=${encodeURIComponent(sendDate)}&language=${language}&render=1`;
}

export function happeningImageObjectKey(issueId: string, language: Language): string {
  return `happening/${DAILY_IMAGE_RENDERER_VERSION}/${issueId}/${language}.png`;
}

export function happeningImageUrl(baseUrl: string, issueId: string, language: Language): string {
  return `${baseUrl.replace(/\/+$/g, "")}/happening-images/${encodeURIComponent(issueId)}/${language}.png`;
}

export function happeningImageDownloadUrl(baseUrl: string, issueId: string, language: Language): string {
  return `${happeningImageUrl(baseUrl, issueId, language)}?download=1`;
}

export function happeningCardUrl(baseUrl: string, issueId: string, language: Language): string {
  return `${baseUrl.replace(/\/+$/g, "")}/daily-card?issue=${encodeURIComponent(issueId)}&language=${language}&render=1`;
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replace(/^data:image\/[^;]+;base64,/u, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function browserScreenshot(browser: BrowserRun, url: string): Promise<Uint8Array> {
  const response = await browser.quickAction("screenshot", {
    url,
    viewport: { width: 900, height: 500, deviceScaleFactor: 2 },
    waitForSelector: { selector: "[data-render-ready=\"true\"]", visible: true, timeout: 60_000 },
    gotoOptions: { waitUntil: "networkidle0", timeout: 60_000 },
    selector: "#daily-poem-paper",
    screenshotOptions: { type: "png", encoding: "base64", omitBackground: false },
  });
  if (!response.ok) throw new Error(`browser_screenshot_${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("image/png")) return new Uint8Array(await response.arrayBuffer());
  const text = await response.text();
  return base64ToBytes(text);
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function ensureDailyImage(
  env: Env,
  sendDate: string,
  language: Language,
): Promise<string> {
  const bucket = env.DAILY_IMAGES;
  const browser = env.BROWSER;
  if (!bucket || !browser) throw new Error("daily_image_bindings_unavailable");
  const key = dailyImageObjectKey(sendDate, language);
  const baseUrl = env.PUBLIC_BASE_URL;
  const existing = await env.DB.prepare(
    "SELECT status FROM daily_poem_assets WHERE send_date = ? AND language = ? AND renderer_version = ? LIMIT 1",
  ).bind(sendDate, language, DAILY_IMAGE_RENDERER_VERSION).first<{ status: string }>();
  if (existing?.status === "ready" && await bucket.head(key)) return dailyImageUrl(baseUrl, sendDate, language);

  const startedAt = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO daily_poem_assets (send_date, language, renderer_version, object_key, status, created_at) VALUES (?, ?, ?, ?, 'generating', ?) ON CONFLICT(send_date, language, renderer_version) DO UPDATE SET object_key = excluded.object_key, status = 'generating', error_code = NULL, created_at = excluded.created_at, completed_at = NULL",
  ).bind(sendDate, language, DAILY_IMAGE_RENDERER_VERSION, key, startedAt).run();

  try {
    const bytes = await browserScreenshot(browser, dailyCardUrl(baseUrl, sendDate, language));
    if (bytes.byteLength < 100) throw new Error("daily_image_empty");
    const digest = await sha256(bytes);
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: "image/png", cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { sendDate, language, rendererVersion: DAILY_IMAGE_RENDERER_VERSION, sha256: digest },
    });
    await env.DB.prepare(
      "UPDATE daily_poem_assets SET status = 'ready', sha256 = ?, error_code = NULL, completed_at = ? WHERE send_date = ? AND language = ? AND renderer_version = ?",
    ).bind(digest, new Date().toISOString(), sendDate, language, DAILY_IMAGE_RENDERER_VERSION).run();
    return dailyImageUrl(baseUrl, sendDate, language);
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 120) : "daily_image_failed";
    await env.DB.prepare(
      "UPDATE daily_poem_assets SET status = 'failed', error_code = ?, completed_at = ? WHERE send_date = ? AND language = ? AND renderer_version = ?",
    ).bind(errorCode, new Date().toISOString(), sendDate, language, DAILY_IMAGE_RENDERER_VERSION).run();
    throw error;
  }
}

export async function ensureHappeningImage(
  env: Env,
  issueId: string,
  language: Language,
): Promise<string> {
  const bucket = env.DAILY_IMAGES;
  const browser = env.BROWSER;
  if (!bucket || !browser) throw new Error("daily_image_bindings_unavailable");
  const key = happeningImageObjectKey(issueId, language);
  const baseUrl = env.PUBLIC_BASE_URL;
  const existing = await env.DB.prepare(
    "SELECT status FROM happening_issue_assets WHERE issue_id = ? AND language = ? AND renderer_version = ? LIMIT 1",
  ).bind(issueId, language, DAILY_IMAGE_RENDERER_VERSION).first<{ status: string }>();
  if (existing?.status === "ready" && await bucket.head(key)) return happeningImageUrl(baseUrl, issueId, language);

  const startedAt = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO happening_issue_assets (issue_id, language, renderer_version, object_key, status, created_at) VALUES (?, ?, ?, ?, 'generating', ?) ON CONFLICT(issue_id, language, renderer_version) DO UPDATE SET object_key = excluded.object_key, status = 'generating', error_code = NULL, created_at = excluded.created_at, completed_at = NULL",
  ).bind(issueId, language, DAILY_IMAGE_RENDERER_VERSION, key, startedAt).run();

  try {
    const bytes = await browserScreenshot(browser, happeningCardUrl(baseUrl, issueId, language));
    if (bytes.byteLength < 100) throw new Error("daily_image_empty");
    const digest = await sha256(bytes);
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: "image/png", cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { issueId, language, rendererVersion: DAILY_IMAGE_RENDERER_VERSION, sha256: digest },
    });
    await env.DB.prepare(
      "UPDATE happening_issue_assets SET status = 'ready', sha256 = ?, error_code = NULL, completed_at = ? WHERE issue_id = ? AND language = ? AND renderer_version = ?",
    ).bind(digest, new Date().toISOString(), issueId, language, DAILY_IMAGE_RENDERER_VERSION).run();
    return happeningImageUrl(baseUrl, issueId, language);
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 120) : "daily_image_failed";
    await env.DB.prepare(
      "UPDATE happening_issue_assets SET status = 'failed', error_code = ?, completed_at = ? WHERE issue_id = ? AND language = ? AND renderer_version = ?",
    ).bind(errorCode, new Date().toISOString(), issueId, language, DAILY_IMAGE_RENDERER_VERSION).run();
    throw error;
  }
}

export async function serveDailyImage(request: Request, env: Env): Promise<Response> {
  const match = new URL(request.url).pathname.match(/^\/daily-images\/(\d{4}-\d{2}-\d{2})\/(en|zh|ja)\.png$/u);
  if (!match) return new Response("Not Found", { status: 404 });
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405 });
  const object = await env.DAILY_IMAGES.get(dailyImageObjectKey(match[1], match[2] as Language));
  if (!object) return new Response("Not Found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  if (new URL(request.url).searchParams.get("download") === "1") {
    headers.set("content-disposition", `attachment; filename="stillpoint-haiku-${match[1]}.png"`);
  }
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}

export async function serveHappeningImage(request: Request, env: Env): Promise<Response> {
  const match = new URL(request.url).pathname.match(/^\/happening-images\/([0-9a-f-]{36})\/(en|zh|ja)\.png$/u);
  if (!match) return new Response("Not Found", { status: 404 });
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405 });
  const object = await env.DAILY_IMAGES.get(happeningImageObjectKey(match[1], match[2] as Language));
  if (!object) return new Response("Not Found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  if (new URL(request.url).searchParams.get("download") === "1") {
    headers.set("content-disposition", `attachment; filename="haikuly-happening-${match[1]}.png"`);
  }
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}
