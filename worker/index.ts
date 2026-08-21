/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
