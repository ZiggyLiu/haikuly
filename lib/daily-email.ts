import { generateModernHaiku } from "../app/api/modern-haiku/route";
import type { Haiku, Language } from "../app/haiku";
import { sendResendBatch, ResendError } from "./resend";
import { requireSubscriptionConfig, type SecretBindings } from "./runtime-config";
import { buildDailyEmail } from "./subscription-email";
import { createSubscriptionCrypto } from "./subscription-crypto";
import { listActiveSubscribers } from "./subscriber-store";

type DailyEmailEnv = Env & SecretBindings;

type DailyPoemRow = {
  poem_json: string;
};

const FEEDBACK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function parseHaiku(value: string): Haiku | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const candidate = parsed as Partial<Haiku>;
    if (!Array.isArray(candidate.lines) || candidate.lines.length !== 3 ||
      !candidate.lines.every((line) => typeof line === "string") ||
      typeof candidate.seed !== "number" || typeof candidate.createdAt !== "string" ||
      !candidate.illustration || typeof candidate.illustration !== "object") return null;
    return candidate as Haiku;
  } catch {
    return null;
  }
}

async function recentPoemLines(db: D1Database, language: Language): Promise<string[]> {
  const result = await db.prepare(
    "SELECT poem_json FROM daily_poems WHERE language = ? ORDER BY send_date DESC LIMIT 5",
  ).bind(language).all<DailyPoemRow>();
  return result.results.flatMap((row) => parseHaiku(row.poem_json)?.lines ?? []).slice(0, 15);
}

async function getOrCreateDailyPoem(
  db: D1Database,
  sendDate: string,
  language: Language,
  deepSeekApiKey: string,
): Promise<Haiku> {
  const existing = await db.prepare(
    "SELECT poem_json FROM daily_poems WHERE send_date = ? AND language = ? LIMIT 1",
  ).bind(sendDate, language).first<DailyPoemRow>();
  const existingHaiku = existing ? parseHaiku(existing.poem_json) : null;
  if (existingHaiku) return existingHaiku;

  const recentLines = await recentPoemLines(db, language);
  const outcome = await generateModernHaiku({
    mode: "random",
    tone: "modern",
    language,
    keyword: null,
    recentLines,
  }, deepSeekApiKey);
  if (!outcome.ok) throw new Error(`deepseek_${outcome.reason}`);

  const poemJson = JSON.stringify(outcome.haiku);
  await db.prepare(
    "INSERT OR IGNORE INTO daily_poems (send_date, language, poem_json, created_at) VALUES (?, ?, ?, ?)",
  ).bind(sendDate, language, poemJson, new Date().toISOString()).run();
  const stored = await db.prepare(
    "SELECT poem_json FROM daily_poems WHERE send_date = ? AND language = ? LIMIT 1",
  ).bind(sendDate, language).first<DailyPoemRow>();
  const storedHaiku = stored ? parseHaiku(stored.poem_json) : null;
  if (!storedHaiku) throw new Error("daily_poem_storage_failed");
  return storedHaiku;
}

async function completeRun(
  db: D1Database,
  runKey: string,
  status: "sending" | "sent" | "skipped" | "failed",
  recipientCount: number,
  errorCode: string | null,
) {
  const completedAt = status === "sent" || status === "skipped" || status === "failed"
    ? new Date().toISOString()
    : null;
  await db.prepare(
    "UPDATE daily_email_runs SET status = ?, recipient_count = ?, error_code = ?, completed_at = ? WHERE run_key = ?",
  ).bind(status, recipientCount, errorCode, completedAt, runKey).run();
}

export async function runDailyEmail(env: DailyEmailEnv, scheduledTime: number): Promise<void> {
  const config = requireSubscriptionConfig(env);
  if (!env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is unavailable.");
  const sendDate = new Date(scheduledTime).toISOString().slice(0, 10);
  const runKey = `daily-haiku/${sendDate}/v1`;
  const createdAt = new Date().toISOString();
  const claim = await config.db.prepare(
    "INSERT OR IGNORE INTO daily_email_runs (run_key, status, recipient_count, created_at) VALUES (?, 'preparing', 0, ?)",
  ).bind(runKey, createdAt).run();
  if ((claim.meta.changes ?? 0) !== 1) {
    console.log(JSON.stringify({ event: "daily_email_skipped", sendDate, reason: "run_exists" }));
    return;
  }

  let recipientCount = 0;
  try {
    const subscribers = await listActiveSubscribers(config.db, config.maxDailyRecipients);
    if (subscribers.length === 0) {
      await completeRun(config.db, runKey, "skipped", 0, null);
      console.log(JSON.stringify({ event: "daily_email_skipped", sendDate, reason: "no_subscribers" }));
      return;
    }

    const subscriptionCrypto = await createSubscriptionCrypto(config.tokenEncryptionKey);
    const deliverable = [];
    for (const subscriber of subscribers) {
      if (!subscriber.unsubscribe_token) continue;
      const email = await subscriptionCrypto.decryptEmail(subscriber.email_ciphertext);
      if (!email) {
        console.error(JSON.stringify({
          event: "subscriber_email_decryption_failed",
          subscriberId: subscriber.id,
        }));
        continue;
      }
      deliverable.push({ ...subscriber, email, unsubscribe_token: subscriber.unsubscribe_token });
    }
    if (deliverable.length === 0) {
      await completeRun(config.db, runKey, "skipped", 0, "no_deliverable_subscribers");
      return;
    }

    const poems = new Map<Language, Haiku>();
    for (const language of ["en", "zh", "ja"] as const) {
      if (!deliverable.some((subscriber) => subscriber.language === language)) continue;
      poems.set(language, await getOrCreateDailyPoem(config.db, sendDate, language, env.DEEPSEEK_API_KEY));
    }

    const messages = await Promise.all(deliverable.map(async (subscriber) => {
      const poem = poems.get(subscriber.language);
      if (!poem) throw new Error("daily_poem_missing");
      const feedbackToken = await subscriptionCrypto.createActionToken(
        subscriber.id,
        "feedback",
        subscriber.language,
        Date.now() + FEEDBACK_TTL_MS,
        sendDate,
      );
      return buildDailyEmail(
        subscriber.email,
        subscriber.language,
        poem,
        subscriber.unsubscribe_token,
        feedbackToken,
        {
          from: config.emailFrom,
          replyTo: config.emailReplyTo,
          baseUrl: config.publicBaseUrl,
        },
      );
    }));
    recipientCount = messages.length;
    await completeRun(config.db, runKey, "sending", recipientCount, null);
    await sendResendBatch(config.resendApiKey, messages, runKey);
    await completeRun(config.db, runKey, "sent", recipientCount, null);
    console.log(JSON.stringify({ event: "daily_email_sent", sendDate, recipientCount }));
  } catch (error) {
    const errorCode = error instanceof ResendError
      ? error.code
      : error instanceof Error
        ? error.message.slice(0, 100)
        : "unknown_error";
    await completeRun(config.db, runKey, "failed", recipientCount, errorCode);
    console.error(JSON.stringify({ event: "daily_email_failed", sendDate, recipientCount, errorCode }));
    throw error;
  }
}
