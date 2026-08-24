/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { runDailyEmail } from "../lib/daily-email";
import type { SecretBindings } from "../lib/runtime-config";
import { handleConfirm, handleSubscribe, handleUnsubscribe } from "../lib/subscription-handlers";
import { handleFeedback } from "../lib/feedback-handlers";

function removeBulkFontPreloads(response: Response): Response {
  const link = response.headers.get("Link");
  if (!link?.includes("/assets/_vinext_fonts/")) return response;

  const filteredLink = link
    .split(/,\s*(?=<)/u)
    .filter((entry) => !entry.includes("/assets/_vinext_fonts/"))
    .join(", ");
  const headers = new Headers(response.headers);
  if (filteredLink) headers.set("Link", filteredLink);
  else headers.delete("Link");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env & SecretBindings, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 🚪 Door bouncer: slam the door on known attack probes (free — no WAF needed).
    // These are the hacker paths we saw in the 24h log: WordPress attack paths
    // (/wp-admin, /wp-login, /xmlrpc.php) plus sensitive-file probes (/.env, /.git)
    // and known scanner scripts. Blocked BEFORE logging, so the guest book stays clean.
    const BLOCKED_PATTERNS = [
      "/wp-admin",
      "/wp-login",
      "/xmlrpc.php",
      "/.env",
      "/.git",
      "/bot-connect.js",
      "/licensor.js",
      "/twint_ch.js",
      "/lkk_ch.js",
    ];
    if (BLOCKED_PATTERNS.some((pattern) => pathname.includes(pattern))) {
      return new Response("Not Found", {
        status: 404,
        headers: { "x-haikuly-doorman": "blocked" },
      });
    }

    // 📖 Visitor guest book: write down every meaningful visit.
    // Skips static assets (fonts/CSS/JS chunks) so the log isn't flooded.
    const isStaticAsset =
      pathname.startsWith("/assets/") ||
      pathname.startsWith("/_vinext/") ||
      pathname.startsWith("/.vite/") ||
      pathname === "/favicon.ico";
    if (!isStaticAsset) {
      console.log(JSON.stringify({
        event: "visit",
        time: new Date().toISOString(),
        ip: request.headers.get("CF-Connecting-IP") ?? "unknown",
        country: request.headers.get("CF-IPCountry") ?? "unknown",
        method: request.method,
        path: pathname,
        userAgent: (request.headers.get("User-Agent") ?? "").slice(0, 200),
      }));
    }

    if (pathname === "/api/subscribe") return handleSubscribe(request, env);
    if (pathname === "/api/confirm") return handleConfirm(request, env);
    if (pathname === "/api/unsubscribe") return handleUnsubscribe(request, env);
    if (pathname === "/api/feedback") return handleFeedback(request, env);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const outputFormat = format === "image/avif" || format === "image/webp" || format === "image/jpeg"
            ? format
            : "image/jpeg";
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format: outputFormat, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return removeBulkFontPreloads(await handler.fetch(request, env, ctx));
  },

  async scheduled(controller: ScheduledController, env: Env & SecretBindings): Promise<void> {
    await runDailyEmail(env, controller.scheduledTime);
  },
} satisfies ExportedHandler<Env & SecretBindings>;

export default worker;
