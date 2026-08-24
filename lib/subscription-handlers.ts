import type { Language } from "../app/haiku";
import { sendResendEmail } from "./resend";
import { requireSubscriptionConfig, type HaikulyRuntimeEnv } from "./runtime-config";
import { buildConfirmationEmail, subscriptionResultHtml } from "./subscription-email";
import { createSubscriptionCrypto, isValidEmail, normalizeEmail } from "./subscription-crypto";
import {
  activateSubscriber,
  claimConfirmationSend,
  clearFailedConfirmationClaim,
  findSubscriberByEmailHash,
  findSubscriberById,
  insertSubscriber,
  preparePendingSubscriber,
  reserveConfirmationQuota,
  unsubscribeSubscriber,
  updateActiveSubscriberLanguage,
} from "./subscriber-store";

const MAX_BODY_BYTES = 4096;
const CONFIRMATION_TTL_MS = 48 * 60 * 60 * 1000;
const CONFIRMATION_COOLDOWN_MS = 15 * 60 * 1000;

type SubscribePayload = {
  email?: unknown;
  language?: unknown;
  website?: unknown;
};

type SubscribeBodyResult =
  | { kind: "ok"; payload: SubscribePayload }
  | { kind: "invalid" }
  | { kind: "too_large" };

const RESPONSE_COPY: Record<Language, {
  accepted: string;
  active: string;
  invalid: string;
  unavailable: string;
  limited: string;
}> = {
  en: {
    accepted: "Check your inbox and confirm your daily haiku subscription.",
    active: "Your daily haiku subscription is active.",
    invalid: "Enter a valid email address.",
    unavailable: "The subscription service is not ready. Please try again later.",
    limited: "The daily confirmation limit is full. Please try again tomorrow.",
  },
  zh: {
    accepted: "请查看邮箱并确认每日俳句订阅。",
    active: "你的每日俳句订阅已生效。",
    invalid: "请输入有效的邮箱地址。",
    unavailable: "订阅服务暂时不可用，请稍后重试。",
    limited: "今天的确认邮件额度已满，请明天再试。",
  },
  ja: {
    accepted: "受信箱を確認し、毎日俳句の購読を確定してください。",
    active: "毎日俳句の購読は有効です。",
    invalid: "有効なメールアドレスを入力してください。",
    unavailable: "購読サービスは現在利用できません。後でもう一度お試しください。",
    limited: "本日の確認メール上限に達しました。明日もう一度お試しください。",
  },
};

function languageFrom(value: unknown): Language {
  return value === "zh" || value === "ja" ? value : "en";
}

function jsonResponse(message: string, status: number) {
  return Response.json({ message }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}

function htmlResponse(body: string, status: number) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
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

async function readSubscribeBody(request: Request): Promise<SubscribeBodyResult> {
  if (!request.body) return { kind: "invalid" };
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
        return { kind: "too_large" };
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
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { kind: "invalid" };
    return { kind: "ok", payload: parsed as SubscribePayload };
  } catch {
    return { kind: "invalid" };
  }
}

export async function handleSubscribe(request: Request, env: HaikulyRuntimeEnv): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  if (!sameOrigin(request)) return jsonResponse("Cross-origin requests are not accepted.", 403);
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonResponse("The request is too large.", 413);
  }

  const body = await readSubscribeBody(request);
  if (body.kind === "too_large") return jsonResponse("The request is too large.", 413);
  if (body.kind === "invalid") return jsonResponse("Send a valid JSON request.", 400);
  const payload = body.payload;

  const language = languageFrom(payload.language);
  const copy = RESPONSE_COPY[language];
  if (typeof payload.website === "string" && payload.website.trim()) {
    return jsonResponse(copy.accepted, 202);
  }
  const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
  if (!isValidEmail(email)) return jsonResponse(copy.invalid, 400);

  try {
    const config = requireSubscriptionConfig(env);
    const subscriptionCrypto = await createSubscriptionCrypto(config.tokenEncryptionKey);
    const [emailHash, emailCiphertext] = await Promise.all([
      subscriptionCrypto.emailHash(email),
      subscriptionCrypto.encryptEmail(email),
    ]);
    const nowDate = new Date();
    const now = nowDate.toISOString();
    let subscriber = await findSubscriberByEmailHash(config.db, emailHash);

    if (!subscriber) {
      const id = crypto.randomUUID();
      const confirmationToken = await subscriptionCrypto.createActionToken(
        id,
        "confirm",
        language,
        nowDate.getTime() + CONFIRMATION_TTL_MS,
      );
      await insertSubscriber(config.db, {
        id,
        email_ciphertext: emailCiphertext,
        email_hash: emailHash,
        language,
        confirmation_token: confirmationToken,
        created_at: now,
        updated_at: now,
      });
      subscriber = await findSubscriberByEmailHash(config.db, emailHash);
    }

    if (!subscriber) throw new Error("Subscriber creation failed.");
    if (subscriber.status === "active") {
      await updateActiveSubscriberLanguage(config.db, subscriber.id, emailCiphertext, language, now);
      return jsonResponse(copy.active, 200);
    }

    let confirmationToken = subscriber.confirmation_token;
    const tokenPayload = confirmationToken
      ? await subscriptionCrypto.readActionToken(confirmationToken, "confirm")
      : null;
    if (!tokenPayload || tokenPayload.subscriberId !== subscriber.id || tokenPayload.language !== language) {
      confirmationToken = await subscriptionCrypto.createActionToken(
        subscriber.id,
        "confirm",
        language,
        nowDate.getTime() + CONFIRMATION_TTL_MS,
      );
      await preparePendingSubscriber(
        config.db,
        subscriber.id,
        emailCiphertext,
        language,
        confirmationToken,
        now,
      );
    }
    if (!confirmationToken) throw new Error("Confirmation token creation failed.");

    const cooldownCutoff = new Date(nowDate.getTime() - CONFIRMATION_COOLDOWN_MS).toISOString();
    const claim = await claimConfirmationSend(
      config.db,
      subscriber.id,
      confirmationToken,
      now,
      cooldownCutoff,
    );
    if (!claim) return jsonResponse(copy.accepted, 202);

    const quotaAvailable = await reserveConfirmationQuota(
      config.db,
      now.slice(0, 10),
      now,
      config.maxDailyConfirmations,
    );
    if (!quotaAvailable) {
      await clearFailedConfirmationClaim(config.db, subscriber.id, now);
      return jsonResponse(copy.limited, 429);
    }

    const message = buildConfirmationEmail(email, language, confirmationToken, {
      from: config.emailFrom,
      replyTo: config.emailReplyTo,
      baseUrl: config.publicBaseUrl,
    });
    try {
      await sendResendEmail(
        config.resendApiKey,
        message,
        `confirm/${subscriber.id}/${nowDate.getTime()}`,
      );
    } catch (error) {
      await clearFailedConfirmationClaim(config.db, subscriber.id, now);
      throw error;
    }
    return jsonResponse(copy.accepted, 202);
  } catch (error) {
    console.error(JSON.stringify({
      event: "subscription_failed",
      code: error instanceof Error ? error.name : "unknown_error",
    }));
    return jsonResponse(copy.unavailable, 503);
  }
}

export async function handleConfirm(request: Request, env: HaikulyRuntimeEnv): Promise<Response> {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
  const token = new URL(request.url).searchParams.get("token") ?? "";
  let language: Language = "en";
  try {
    const config = requireSubscriptionConfig(env);
    const subscriptionCrypto = await createSubscriptionCrypto(config.tokenEncryptionKey);
    const payload = await subscriptionCrypto.readActionToken(token, "confirm");
    if (!payload) return htmlResponse(subscriptionResultHtml(language, "invalid", config.publicBaseUrl), 400);
    language = payload.language;
    const subscriber = await findSubscriberById(config.db, payload.subscriberId);
    if (!subscriber) return htmlResponse(subscriptionResultHtml(language, "invalid", config.publicBaseUrl), 400);
    if (subscriber.status === "active") {
      return htmlResponse(subscriptionResultHtml(language, "confirmed", config.publicBaseUrl), 200);
    }
    if (subscriber.status !== "pending" || subscriber.confirmation_token !== token) {
      return htmlResponse(subscriptionResultHtml(language, "invalid", config.publicBaseUrl), 400);
    }

    const unsubscribeToken = await subscriptionCrypto.createActionToken(
      subscriber.id,
      "unsubscribe",
      subscriber.language,
      null,
    );
    const activated = await activateSubscriber(
      config.db,
      subscriber.id,
      token,
      unsubscribeToken,
      new Date().toISOString(),
    );
    return htmlResponse(
      subscriptionResultHtml(language, activated ? "confirmed" : "invalid", config.publicBaseUrl),
      activated ? 200 : 400,
    );
  } catch (error) {
    console.error(JSON.stringify({
      event: "subscription_confirmation_failed",
      code: error instanceof Error ? error.name : "unknown_error",
    }));
    return htmlResponse(subscriptionResultHtml(language, "invalid", "https://haikuly.fyi"), 503);
  }
}

async function processUnsubscribe(token: string, env: HaikulyRuntimeEnv) {
  const config = requireSubscriptionConfig(env);
  const subscriptionCrypto = await createSubscriptionCrypto(config.tokenEncryptionKey);
  const payload = await subscriptionCrypto.readActionToken(token, "unsubscribe");
  if (!payload) return { ok: false as const, language: "en" as Language, baseUrl: config.publicBaseUrl };
  const row = await unsubscribeSubscriber(config.db, payload.subscriberId, token, new Date().toISOString());
  return {
    ok: Boolean(row),
    language: row?.language ?? payload.language,
    baseUrl: config.publicBaseUrl,
  };
}

export async function handleUnsubscribe(request: Request, env: HaikulyRuntimeEnv): Promise<Response> {
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST" } });
  }
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (request.method === "POST") {
    try {
      await processUnsubscribe(token, env);
    } catch (error) {
      console.error(JSON.stringify({
        event: "one_click_unsubscribe_failed",
        code: error instanceof Error ? error.name : "unknown_error",
      }));
    }
    return new Response(null, {
      status: 200,
      headers: { "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'" },
    });
  }

  try {
    const result = await processUnsubscribe(token, env);
    return htmlResponse(
      subscriptionResultHtml(result.language, result.ok ? "unsubscribed" : "invalid", result.baseUrl),
      result.ok ? 200 : 400,
    );
  } catch (error) {
    console.error(JSON.stringify({
      event: "unsubscribe_failed",
      code: error instanceof Error ? error.name : "unknown_error",
    }));
    return htmlResponse(subscriptionResultHtml("en", "invalid", "https://haikuly.fyi"), 503);
  }
}
