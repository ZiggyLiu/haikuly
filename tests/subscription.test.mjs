import assert from "node:assert/strict";
import test from "node:test";
import { buildConfirmationEmail, buildDailyEmail } from "../lib/subscription-email.ts";
import {
  createSubscriptionCrypto,
  isValidEmail,
  normalizeEmail,
} from "../lib/subscription-crypto.ts";
import { ResendError, sendResendBatch, sendResendEmail } from "../lib/resend.ts";
import { handleFeedback } from "../lib/feedback-handlers.ts";

const secret = Buffer.alloc(32, 17).toString("base64");

test("subscription crypto encrypts addresses and authenticates action tokens", async () => {
  const subscriptionCrypto = await createSubscriptionCrypto(secret);
  const email = "Poet@Example.COM";
  const ciphertext = await subscriptionCrypto.encryptEmail(email);

  assert.doesNotMatch(ciphertext, /Poet|Example/);
  assert.equal(await subscriptionCrypto.decryptEmail(ciphertext), "Poet@example.com");
  assert.equal(
    await subscriptionCrypto.emailHash(email),
    await subscriptionCrypto.emailHash("Poet@example.com"),
  );

  const confirmation = await subscriptionCrypto.createActionToken(
    "subscriber-1",
    "confirm",
    "zh",
    Date.now() + 60_000,
  );
  const payload = await subscriptionCrypto.readActionToken(confirmation, "confirm");
  assert.equal(payload?.subscriberId, "subscriber-1");
  assert.equal(payload?.language, "zh");
  assert.equal(await subscriptionCrypto.readActionToken(confirmation, "unsubscribe"), null);

  const tamperIndex = Math.min(10, confirmation.length - 2);
  const tampered = `${confirmation.slice(0, tamperIndex)}${confirmation[tamperIndex] === "A" ? "B" : "A"}${confirmation.slice(tamperIndex + 1)}`;
  assert.equal(await subscriptionCrypto.readActionToken(tampered, "confirm"), null);
  const expired = await subscriptionCrypto.createActionToken("subscriber-1", "confirm", "en", Date.now() - 1);
  assert.equal(await subscriptionCrypto.readActionToken(expired, "confirm"), null);

  const feedback = await subscriptionCrypto.createActionToken(
    "subscriber-1",
    "feedback",
    "zh",
    Date.now() + 60_000,
    "2026-08-23",
  );
  const feedbackPayload = await subscriptionCrypto.readActionToken(feedback, "feedback");
  assert.equal(feedbackPayload?.subscriberId, "subscriber-1");
  assert.equal(feedbackPayload?.messageId, "2026-08-23");
  assert.equal(await subscriptionCrypto.readActionToken(feedback, "unsubscribe"), null);
});

test("email validation normalizes only the domain and rejects malformed addresses", () => {
  assert.equal(normalizeEmail("  Poet@Example.COM "), "Poet@example.com");
  assert.equal(isValidEmail("Poet@example.com"), true);
  assert.equal(isValidEmail("poet@example"), false);
  assert.equal(isValidEmail("poet @example.com"), false);
  assert.equal(isValidEmail("@example.com"), false);
});

test("daily email contains plain text, escaped HTML, and one-click unsubscribe headers", () => {
  const message = buildDailyEmail(
    "reader@example.com",
    "en",
    {
      lines: ["Wind & paper", "<quiet> at the doorway", "Evening settles"],
      seed: 1,
      createdAt: "2026-08-23T08:00:00.000Z",
      illustration: { motif: "doorway", accent: "none", tone: "sage", placement: "right" },
    },
    "unsubscribe-token",
    "feedback-token",
    {
      from: "Haiku-ly <daily@haikuly.fyi>",
      replyTo: "zhiguoinusa@gmail.com",
      baseUrl: "https://haikuly.fyi/",
    },
  );

  assert.equal(message.to[0], "reader@example.com");
  assert.equal(message.reply_to, "zhiguoinusa@gmail.com");
  assert.match(message.html, /Wind &amp; paper/);
  assert.match(message.html, /&lt;quiet&gt;/);
  assert.doesNotMatch(message.html, /<quiet>/);
  assert.match(message.text, /Wind & paper/);
  assert.match(message.html, />Give feedback<\/a>/);
  assert.match(message.html, /\/feedback\?token=feedback-token&amp;lang=en/);
  assert.doesNotMatch(message.html, /feedback\?token=unsubscribe-token/);
  assert.equal(message.headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.match(message.headers?.["List-Unsubscribe"] ?? "", /^<https:\/\/haikuly\.fyi\/api\/unsubscribe\?token=/);
});

test("daily feedback CTA uses localized Chinese copy and a dedicated opaque token", () => {
  const message = buildDailyEmail(
    "reader@example.com",
    "zh",
    {
      lines: ["地铁刚到站", "耳机里换了一首歌", "雨还没停"],
      seed: 2,
      createdAt: "2026-08-23T08:00:00.000Z",
      illustration: { motif: "transit", accent: "umbrella", tone: "blue-gray", placement: "left" },
    },
    "unsubscribe-token-zh",
    "feedback-token-zh",
    {
      from: "Haiku-ly <daily@haikuly.fyi>",
      replyTo: "zhiguoinusa@gmail.com",
      baseUrl: "https://haikuly.fyi",
    },
  );

  assert.match(message.html, />反馈这首俳句<\/a>/);
  assert.match(message.html, /\/feedback\?token=feedback-token-zh&amp;lang=zh/);
  assert.doesNotMatch(message.html, /reader(?:%40|@)example\.com/);
  assert.match(message.text, /反馈这首俳句: https:\/\/haikuly\.fyi\/feedback\?token=feedback-token-zh&lang=zh/);
});

test("daily email includes the hosted card image and localized save links", () => {
  const message = buildDailyEmail(
    "reader@example.com",
    "zh",
    {
      lines: ["地铁刚到站", "耳机里换了一首歌", "雨还没停"],
      seed: 2,
      createdAt: "2026-08-23T08:00:00.000Z",
      illustration: { motif: "transit", accent: "umbrella", tone: "blue-gray", placement: "left" },
    },
    "unsubscribe-token-zh",
    "feedback-token-zh",
    {
      from: "Haiku-ly <daily@haikuly.fyi>",
      replyTo: "zhiguoinusa@gmail.com",
      baseUrl: "https://haikuly.fyi",
    },
    {
      imageUrl: "https://haikuly.fyi/daily-images/2026-08-23/zh.png",
      saveUrl: "https://haikuly.fyi/daily-images/2026-08-23/zh.png?download=1",
      viewUrl: "https://haikuly.fyi/daily-card?date=2026-08-23&language=zh",
    },
  );

  assert.match(message.html, /daily-images\/2026-08-23\/zh\.png/);
  assert.match(message.html, /保存这张图片/);
  assert.match(message.html, /daily-card\?date=2026-08-23&amp;language=zh/);
  assert.match(message.text, /download=1/);
});

test("feedback API validates a dedicated token and records its daily message identifier", async () => {
  const subscriptionCrypto = await createSubscriptionCrypto(secret);
  const token = await subscriptionCrypto.createActionToken(
    "subscriber-1",
    "feedback",
    "zh",
    Date.now() + 60_000,
    "2026-08-23",
  );
  const writes = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              return sql.startsWith("SELECT id, language") ? { id: "subscriber-1", language: "zh" } : null;
            },
            async run() {
              writes.push({ sql, values });
              return { success: true };
            },
          };
        },
      };
    },
  };
  const request = new Request("https://haikuly.fyi/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://haikuly.fyi" },
    body: JSON.stringify({ token, rating: 5, comment: "很喜欢" }),
  });

  const response = await handleFeedback(request, { DB: db, TOKEN_ENCRYPTION_KEY: secret });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).message, "感谢你的反馈。");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].values[1], "subscriber-1");
  assert.equal(writes[0].values[2], "2026-08-23");
  assert.equal(writes[0].values[3], 5);
});

test("confirmation email uses the localized copy and confirmation URL", () => {
  const message = buildConfirmationEmail("reader@example.com", "ja", "confirm-token", {
    from: "Haiku-ly <daily@haikuly.fyi>",
    replyTo: "zhiguoinusa@gmail.com",
    baseUrl: "https://haikuly.fyi",
  });
  assert.match(message.subject, /購読確認/);
  assert.match(message.html, /\/api\/confirm\?token=confirm-token/);
  assert.match(message.text, /48時間/);
});

test("Resend requests use authentication and idempotency without changing the payload", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json({ id: "email-1" });
  };
  const message = buildConfirmationEmail("reader@example.com", "en", "token", {
    from: "Haiku-ly <daily@haikuly.fyi>",
    replyTo: "zhiguoinusa@gmail.com",
    baseUrl: "https://haikuly.fyi",
  });

  await sendResendEmail("re_test_key", message, "confirm/subscriber-1");
  await sendResendBatch("re_test_key", [message], "daily/2026-08-23");

  assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.equal(calls[1].url, "https://api.resend.com/emails/batch");
  assert.equal(calls[0].options.headers.Authorization, "Bearer re_test_key");
  assert.equal(calls[1].options.headers["Idempotency-Key"], "daily/2026-08-23");
  assert.deepEqual(JSON.parse(calls[1].options.body), [message]);
});

test("Resend errors expose a stable code without returning response content", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => Response.json({ name: "validation_error", message: "private detail" }, { status: 422 });
  const message = buildConfirmationEmail("reader@example.com", "en", "token", {
    from: "Haiku-ly <daily@haikuly.fyi>",
    replyTo: "zhiguoinusa@gmail.com",
    baseUrl: "https://haikuly.fyi",
  });

  await assert.rejects(
    sendResendEmail("re_test_key", message, "confirm/subscriber-1"),
    (error) => error instanceof ResendError && error.status === 422 && error.code === "validation_error" &&
      !error.message.includes("private detail"),
  );
});
