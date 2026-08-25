import type { Language } from "../app/haiku";
import type { SecretBindings } from "./runtime-config";
import { createSubscriptionCrypto } from "./subscription-crypto.ts";

const MAX_COMMENT_LENGTH = 1000;
const MAX_BODY_BYTES = 8192;

type FeedbackPayload = {
  token?: unknown;
  rating?: unknown;
  comment?: unknown;
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function languageFrom(value: unknown): Language {
  return value === "zh" || value === "ja" ? value : "en";
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function readFeedbackBody(request: Request): Promise<FeedbackPayload | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_BODY_BYTES) {
        await reader.cancel("Request body is too large.");
        return null;
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as FeedbackPayload
      : null;
  } catch {
    return null;
  }
}

type FeedbackEnv = Env & Pick<SecretBindings, "TOKEN_ENCRYPTION_KEY">;

export async function handleFeedback(request: Request, env: FeedbackEnv): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }
  if (!sameOrigin(request)) return jsonResponse({ error: "Cross-origin requests are not accepted." }, 403);
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "The request is too large." }, 413);
  }
  const body = await readFeedbackBody(request);
  if (!body) return jsonResponse({ error: "Send a valid JSON object." }, 400);

  const token = typeof body.token === "string" ? body.token : "";
  const rating = typeof body.rating === "number" && Number.isInteger(body.rating) ? body.rating : 0;
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (!token || token.length > 2048 || rating < 1 || rating > 5 || comment.length > MAX_COMMENT_LENGTH) {
    return jsonResponse({ error: "Provide a valid rating and a comment of 1000 characters or fewer." }, 400);
  }

  try {
    if (!env.TOKEN_ENCRYPTION_KEY) throw new Error("TOKEN_ENCRYPTION_KEY is unavailable.");
    const subscriptionCrypto = await createSubscriptionCrypto(env.TOKEN_ENCRYPTION_KEY);
    const payload = await subscriptionCrypto.readActionToken(token, "feedback");
    if (!payload?.messageId) {
      return jsonResponse({ error: "This feedback link is no longer valid." }, 404);
    }
    const subscriber = await env.DB.prepare(
      "SELECT id, language FROM subscription_members WHERE id = ? AND status = 'active' LIMIT 1",
    ).bind(payload.subscriberId).first<{ id: string; language: Language }>();

    if (!subscriber) return jsonResponse({ error: "This feedback link is no longer valid." }, 404);

    await env.DB.prepare(
      "INSERT INTO subscription_feedback (id, subscriber_id, poem_date, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), subscriber.id, payload.messageId, rating, comment || null, new Date().toISOString()).run();

    const messages: Record<Language, string> = {
      en: "Thank you for your feedback.",
      zh: "感谢你的反馈。",
      ja: "フィードバックありがとうございます。",
    };
    return jsonResponse({ message: messages[languageFrom(subscriber.language)] }, 201);
  } catch (error) {
    console.error(JSON.stringify({
      event: "feedback_failed",
      code: error instanceof Error ? error.name : "unknown_error",
    }));
    return jsonResponse({ error: "Feedback is temporarily unavailable." }, 503);
  }
}
