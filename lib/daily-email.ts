import { generateModernHaiku } from "../app/api/modern-haiku/route";
import type { Haiku, Language } from "../app/haiku";
import { sendResendEmail, ResendError } from "./resend";
import { requireSubscriptionConfig, type SecretBindings } from "./runtime-config";
import { buildDailyEmail } from "./subscription-email";
import { createSubscriptionCrypto } from "./subscription-crypto";
import {
  advanceSubscriberSchedule,
  claimDailyDelivery,
  completeDailyDelivery,
  dailyDeliveryStatus,
  failDailyDelivery,
  listDueSubscribers,
} from "./subscriber-store";
import {
  dailyCardUrl,
  dailyImageDownloadUrl,
  ensureDailyImage,
  ensureHappeningImage,
  happeningCardUrl,
  happeningImageDownloadUrl,
} from "./daily-image";
import { localDateAt, nextLocalDeliveryAt } from "./timezone";
import { getOrCreateHappeningIssue, type TrendTopic } from "./trends";

type DailyEmailEnv = Env & SecretBindings;

type DailyPoemRow = {
  poem_json: string;
};

const FEEDBACK_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DELIVERY_LEASE_MS = 10 * 60 * 1000;

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
  const scheduledAt = new Date(scheduledTime).toISOString();
  const runKey = `daily-haiku-dispatch/${scheduledTime}/v2`;
  const createdAt = new Date().toISOString();
  const existingRun = await config.db.prepare(
    "SELECT status FROM daily_email_runs WHERE run_key = ? LIMIT 1",
  ).bind(runKey).first<{ status: string }>();
  if (existingRun?.status === "sent" || existingRun?.status === "skipped" || existingRun?.status === "sending" || existingRun?.status === "preparing") {
    console.log(JSON.stringify({ event: "daily_email_skipped", scheduledAt, reason: "run_exists" }));
    return;
  }
  if (existingRun?.status === "failed") {
    await config.db.prepare(
      "UPDATE daily_email_runs SET status = 'preparing', recipient_count = 0, error_code = NULL, completed_at = NULL, created_at = ? WHERE run_key = ?",
    ).bind(createdAt, runKey).run();
  } else {
    const claim = await config.db.prepare(
      "INSERT OR IGNORE INTO daily_email_runs (run_key, status, recipient_count, created_at) VALUES (?, 'preparing', 0, ?)",
    ).bind(runKey, createdAt).run();
    if ((claim.meta.changes ?? 0) !== 1) {
      console.log(JSON.stringify({ event: "daily_email_skipped", scheduledAt, reason: "run_exists" }));
      return;
    }
  }

  let recipientCount = 0;
  try {
    const subscribers = await listDueSubscribers(config.db, scheduledAt, config.maxDailyRecipients);
    if (subscribers.length === 0) {
      await completeRun(config.db, runKey, "skipped", 0, null);
      console.log(JSON.stringify({ event: "daily_email_skipped", scheduledAt, reason: "no_due_subscribers" }));
      return;
    }

    const subscriptionCrypto = await createSubscriptionCrypto(config.tokenEncryptionKey);
    const poems = new Map<string, Haiku>();
    const happeningIssues = new Map<string, { issueId: string; poem: Haiku; topic: TrendTopic } | null>();
    const imageUrls = new Map<string, { imageUrl: string; saveUrl: string; viewUrl: string }>();
    let failureCount = 0;

    await completeRun(config.db, runKey, "sending", subscribers.length, null);
    for (const subscriber of subscribers) {
      if (!subscriber.unsubscribe_token || !subscriber.next_send_at) continue;
      const sendDate = localDateAt(subscriber.next_send_at, subscriber.timezone);
      const attemptedAt = new Date().toISOString();
      const staleBefore = new Date(Date.now() - DELIVERY_LEASE_MS).toISOString();
      const deliveryClaim = await claimDailyDelivery(
        config.db,
        subscriber.id,
        sendDate,
        attemptedAt,
        staleBefore,
      );
      if (!deliveryClaim) {
        if (await dailyDeliveryStatus(config.db, subscriber.id, sendDate) === "sent") {
          const advancedAt = new Date().toISOString();
          await advanceSubscriberSchedule(
            config.db,
            subscriber.id,
            subscriber.next_send_at,
            nextLocalDeliveryAt(scheduledAt, subscriber.timezone),
            advancedAt,
          );
        }
        continue;
      }

      try {
        const email = await subscriptionCrypto.decryptEmail(subscriber.email_ciphertext);
        if (!email) throw new Error("subscriber_email_decryption_failed");
        const wantsHappening = subscriber.content_mode === "happening_now" && Boolean(subscriber.trend_region);
        const happeningKey = wantsHappening
          ? `${subscriber.trend_region}/${subscriber.language}/${Math.floor(scheduledTime / (3 * 60 * 60 * 1000))}`
          : "";
        let issue = happeningKey ? happeningIssues.get(happeningKey) : null;
        if (happeningKey && issue === undefined) {
          issue = await getOrCreateHappeningIssue(
            env,
            subscriber.trend_region as string,
            subscriber.language,
            new Date(scheduledTime),
          );
          happeningIssues.set(happeningKey, issue);
        }
        const contentKey = issue
          ? `happening/${issue.issueId}/${subscriber.language}`
          : `random/${sendDate}/${subscriber.language}`;
        let poem = issue?.poem ?? poems.get(contentKey);
        if (!poem) {
          poem = await getOrCreateDailyPoem(config.db, sendDate, subscriber.language, env.DEEPSEEK_API_KEY);
          poems.set(contentKey, poem);
        }

        let imageLinks = imageUrls.get(contentKey);
        if (!imageLinks) {
          if (issue) {
            const imageUrl = await ensureHappeningImage(env, issue.issueId, subscriber.language);
            imageLinks = {
              imageUrl,
              saveUrl: happeningImageDownloadUrl(config.publicBaseUrl, issue.issueId, subscriber.language),
              viewUrl: happeningCardUrl(config.publicBaseUrl, issue.issueId, subscriber.language),
            };
          } else {
            const imageUrl = await ensureDailyImage(env, sendDate, subscriber.language);
            imageLinks = {
              imageUrl,
              saveUrl: dailyImageDownloadUrl(config.publicBaseUrl, sendDate, subscriber.language),
              viewUrl: dailyCardUrl(config.publicBaseUrl, sendDate, subscriber.language),
            };
          }
          imageUrls.set(contentKey, imageLinks);
        }

        const feedbackToken = await subscriptionCrypto.createActionToken(
          subscriber.id,
          "feedback",
          subscriber.language,
          Date.now() + FEEDBACK_TTL_MS,
          sendDate,
        );
        const message = buildDailyEmail(
          email,
          subscriber.language,
          poem,
          subscriber.unsubscribe_token,
          feedbackToken,
          {
            from: config.emailFrom,
            replyTo: config.emailReplyTo,
            baseUrl: config.publicBaseUrl,
          },
          imageLinks,
          issue?.topic,
        );
        await sendResendEmail(
          config.resendApiKey,
          message,
          `daily/${subscriber.id}/${sendDate}/v2`,
        );
        const completedAt = new Date().toISOString();
        await completeDailyDelivery(
          config.db,
          subscriber.id,
          sendDate,
          attemptedAt,
          subscriber.next_send_at,
          completedAt,
          nextLocalDeliveryAt(completedAt, subscriber.timezone),
        );
        recipientCount += 1;
      } catch (error) {
        failureCount += 1;
        const errorCode = error instanceof ResendError
          ? error.code
          : error instanceof Error
            ? error.message.slice(0, 100)
            : "unknown_error";
        await failDailyDelivery(config.db, subscriber.id, sendDate, attemptedAt, errorCode);
        console.error(JSON.stringify({
          event: "daily_email_delivery_failed",
          subscriberId: subscriber.id,
          sendDate,
          errorCode,
        }));
      }
    }

    await completeRun(
      config.db,
      runKey,
      failureCount > 0 ? "failed" : recipientCount > 0 ? "sent" : "skipped",
      recipientCount,
      failureCount > 0 ? `${failureCount}_delivery_failures` : null,
    );
    console.log(JSON.stringify({ event: "daily_email_dispatch_completed", scheduledAt, recipientCount, failureCount }));
  } catch (error) {
    const errorCode = error instanceof ResendError
      ? error.code
      : error instanceof Error
        ? error.message.slice(0, 100)
        : "unknown_error";
    await completeRun(config.db, runKey, "failed", recipientCount, errorCode);
    console.error(JSON.stringify({ event: "daily_email_failed", scheduledAt, recipientCount, errorCode }));
    throw error;
  }
}
