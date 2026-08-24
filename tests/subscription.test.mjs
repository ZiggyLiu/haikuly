import assert from "node:assert/strict";
import test from "node:test";
import { buildConfirmationEmail, buildDailyEmail } from "../lib/subscription-email.ts";
import {
  createSubscriptionCrypto,
  isValidEmail,
  normalizeEmail,
} from "../lib/subscription-crypto.ts";
import { ResendError, sendResendBatch, sendResendEmail } from "../lib/resend.ts";

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
  assert.equal(message.headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.match(message.headers?.["List-Unsubscribe"] ?? "", /^<https:\/\/haikuly\.fyi\/api\/unsubscribe\?token=/);
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
