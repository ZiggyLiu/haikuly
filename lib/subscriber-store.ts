import type { Language } from "../app/haiku";
import type { SubscriptionContentMode } from "./trends";

export type SubscriberStatus = "pending" | "active" | "unsubscribed";

export type SubscriberRow = {
  id: string;
  email_ciphertext: string;
  email_hash: string;
  language: Language;
  timezone: string;
  content_mode: SubscriptionContentMode;
  trend_region: string | null;
  region_detected_at: string | null;
  region_detection_method: string | null;
  next_send_at: string | null;
  status: SubscriberStatus;
  confirmation_token: string | null;
  unsubscribe_token: string | null;
  confirmation_sent_at: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function findSubscriberByEmailHash(db: D1Database, emailHash: string) {
  return db.prepare(
    "SELECT id, email_ciphertext, email_hash, language, timezone, content_mode, trend_region, region_detected_at, region_detection_method, next_send_at, status, confirmation_token, unsubscribe_token, " +
    "confirmation_sent_at, confirmed_at, unsubscribed_at, created_at, updated_at " +
    "FROM subscription_members WHERE email_hash = ? LIMIT 1",
  ).bind(emailHash).first<SubscriberRow>();
}

export async function findSubscriberById(db: D1Database, id: string) {
  return db.prepare(
    "SELECT id, email_ciphertext, email_hash, language, timezone, content_mode, trend_region, region_detected_at, region_detection_method, next_send_at, status, confirmation_token, unsubscribe_token, " +
    "confirmation_sent_at, confirmed_at, unsubscribed_at, created_at, updated_at " +
    "FROM subscription_members WHERE id = ? LIMIT 1",
  ).bind(id).first<SubscriberRow>();
}

export async function insertSubscriber(
  db: D1Database,
  row: Pick<SubscriberRow, "id" | "email_ciphertext" | "email_hash" | "language" | "timezone" | "content_mode" | "trend_region" | "region_detected_at" | "region_detection_method" | "confirmation_token" | "created_at" | "updated_at">,
) {
  await db.prepare(
    "INSERT OR IGNORE INTO subscription_members " +
    "(id, email_ciphertext, email_hash, language, timezone, content_mode, trend_region, region_detected_at, region_detection_method, status, confirmation_token, created_at, updated_at) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
  ).bind(
    row.id,
    row.email_ciphertext,
    row.email_hash,
    row.language,
    row.timezone,
    row.content_mode,
    row.trend_region,
    row.region_detected_at,
    row.region_detection_method,
    row.confirmation_token,
    row.created_at,
    row.updated_at,
  ).run();
}

export async function updateActiveSubscriberPreferences(
  db: D1Database,
  id: string,
  emailCiphertext: string,
  language: Language,
  timezone: string,
  contentMode: SubscriptionContentMode,
  trendRegion: string,
  regionDetectedAt: string,
  nextSendAt: string,
  updatedAt: string,
) {
  await db.prepare(
    "UPDATE subscription_members SET email_ciphertext = ?, language = ?, timezone = ?, content_mode = ?, trend_region = ?, region_detected_at = ?, region_detection_method = 'cloudflare_country', next_send_at = ?, updated_at = ? " +
    "WHERE id = ? AND status = 'active'",
  ).bind(emailCiphertext, language, timezone, contentMode, trendRegion, regionDetectedAt, nextSendAt, updatedAt, id).run();
}

export async function preparePendingSubscriber(
  db: D1Database,
  id: string,
  emailCiphertext: string,
  language: Language,
  timezone: string,
  contentMode: SubscriptionContentMode,
  trendRegion: string,
  regionDetectedAt: string,
  confirmationToken: string,
  updatedAt: string,
) {
  await db.prepare(
    "UPDATE subscription_members SET email_ciphertext = ?, language = ?, timezone = ?, content_mode = ?, trend_region = ?, region_detected_at = ?, region_detection_method = 'cloudflare_country', next_send_at = NULL, status = 'pending', confirmation_token = ?, " +
    "unsubscribe_token = NULL, confirmation_sent_at = NULL, confirmed_at = NULL, unsubscribed_at = NULL, updated_at = ? " +
    "WHERE id = ?",
  ).bind(emailCiphertext, language, timezone, contentMode, trendRegion, regionDetectedAt, confirmationToken, updatedAt, id).run();
}

export async function claimConfirmationSend(
  db: D1Database,
  id: string,
  confirmationToken: string,
  now: string,
  cooldownCutoff: string,
) {
  return db.prepare(
    "UPDATE subscription_members SET confirmation_token = ?, confirmation_sent_at = ?, updated_at = ? " +
    "WHERE id = ? AND status = 'pending' AND (confirmation_sent_at IS NULL OR confirmation_sent_at < ?) " +
    "RETURNING id",
  ).bind(confirmationToken, now, now, id, cooldownCutoff).first<{ id: string }>();
}

export async function clearFailedConfirmationClaim(db: D1Database, id: string, claimedAt: string) {
  await db.prepare(
    "UPDATE subscription_members SET confirmation_sent_at = NULL WHERE id = ? AND status = 'pending' AND confirmation_sent_at = ?",
  ).bind(id, claimedAt).run();
}

export async function reserveConfirmationQuota(
  db: D1Database,
  quotaDate: string,
  now: string,
  limit: number,
) {
  const results = await db.batch([
    db.prepare(
      "INSERT OR IGNORE INTO email_quotas (quota_date, confirmation_count, updated_at) VALUES (?, 0, ?)",
    ).bind(quotaDate, now),
    db.prepare(
      "UPDATE email_quotas SET confirmation_count = confirmation_count + 1, updated_at = ? " +
      "WHERE quota_date = ? AND confirmation_count < ? RETURNING confirmation_count",
    ).bind(now, quotaDate, limit),
  ]);
  const update = results[1] as D1Result<{ confirmation_count: number }>;
  return update.results.length > 0;
}

export async function activateSubscriber(
  db: D1Database,
  id: string,
  confirmationToken: string,
  unsubscribeToken: string,
  nextSendAt: string,
  now: string,
) {
  return db.prepare(
    "UPDATE subscription_members SET status = 'active', confirmation_token = NULL, unsubscribe_token = ?, " +
    "next_send_at = ?, confirmed_at = ?, unsubscribed_at = NULL, updated_at = ? " +
    "WHERE id = ? AND status = 'pending' AND confirmation_token = ? RETURNING id",
  ).bind(unsubscribeToken, nextSendAt, now, now, id, confirmationToken).first<{ id: string }>();
}

export async function unsubscribeSubscriber(
  db: D1Database,
  id: string,
  unsubscribeToken: string,
  now: string,
) {
  return db.prepare(
    "UPDATE subscription_members SET status = 'unsubscribed', next_send_at = NULL, unsubscribed_at = ?, updated_at = ? " +
    "WHERE id = ? AND unsubscribe_token = ? AND status IN ('active', 'unsubscribed') RETURNING id, language",
  ).bind(now, now, id, unsubscribeToken).first<{ id: string; language: Language }>();
}

export type DueSubscriberRow = Pick<
  SubscriberRow,
  "id" | "email_ciphertext" | "language" | "timezone" | "content_mode" | "trend_region" | "next_send_at" | "unsubscribe_token"
>;

export async function listDueSubscribers(db: D1Database, dueAt: string, limit: number) {
  const result = await db.prepare(
    "SELECT id, email_ciphertext, language, timezone, content_mode, trend_region, next_send_at, unsubscribe_token FROM subscription_members " +
    "WHERE status = 'active' AND unsubscribe_token IS NOT NULL AND next_send_at IS NOT NULL AND next_send_at <= ? " +
    "ORDER BY next_send_at ASC LIMIT ?",
  ).bind(dueAt, limit).all<DueSubscriberRow>();
  return result.results;
}

export async function claimDailyDelivery(
  db: D1Database,
  subscriberId: string,
  localDate: string,
  attemptedAt: string,
  staleBefore: string,
) {
  return db.prepare(
    "INSERT INTO daily_email_deliveries (subscriber_id, local_date, status, attempted_at) VALUES (?, ?, 'preparing', ?) " +
    "ON CONFLICT(subscriber_id, local_date) DO UPDATE SET status = 'preparing', error_code = NULL, attempted_at = excluded.attempted_at, completed_at = NULL " +
    "WHERE daily_email_deliveries.status = 'failed' OR " +
    "(daily_email_deliveries.status = 'preparing' AND daily_email_deliveries.attempted_at < ?) " +
    "RETURNING subscriber_id",
  ).bind(subscriberId, localDate, attemptedAt, staleBefore).first<{ subscriber_id: string }>();
}

export async function completeDailyDelivery(
  db: D1Database,
  subscriberId: string,
  localDate: string,
  attemptedAt: string,
  expectedNextSendAt: string,
  completedAt: string,
  nextSendAt: string,
) {
  await db.batch([
    db.prepare(
      "UPDATE daily_email_deliveries SET status = 'sent', error_code = NULL, completed_at = ? " +
      "WHERE subscriber_id = ? AND local_date = ? AND status = 'preparing' AND attempted_at = ?",
    ).bind(completedAt, subscriberId, localDate, attemptedAt),
    db.prepare(
      "UPDATE subscription_members SET next_send_at = ?, updated_at = ? " +
      "WHERE id = ? AND status = 'active' AND next_send_at = ?",
    ).bind(nextSendAt, completedAt, subscriberId, expectedNextSendAt),
  ]);
}

export async function dailyDeliveryStatus(db: D1Database, subscriberId: string, localDate: string) {
  const row = await db.prepare(
    "SELECT status FROM daily_email_deliveries WHERE subscriber_id = ? AND local_date = ? LIMIT 1",
  ).bind(subscriberId, localDate).first<{ status: "preparing" | "sent" | "failed" }>();
  return row?.status ?? null;
}

export async function advanceSubscriberSchedule(
  db: D1Database,
  subscriberId: string,
  expectedNextSendAt: string,
  nextSendAt: string,
  updatedAt: string,
) {
  await db.prepare(
    "UPDATE subscription_members SET next_send_at = ?, updated_at = ? " +
    "WHERE id = ? AND status = 'active' AND next_send_at = ?",
  ).bind(nextSendAt, updatedAt, subscriberId, expectedNextSendAt).run();
}

export async function failDailyDelivery(
  db: D1Database,
  subscriberId: string,
  localDate: string,
  attemptedAt: string,
  errorCode: string,
) {
  await db.prepare(
    "UPDATE daily_email_deliveries SET status = 'failed', error_code = ?, completed_at = ? " +
    "WHERE subscriber_id = ? AND local_date = ? AND status = 'preparing' AND attempted_at = ?",
  ).bind(errorCode, new Date().toISOString(), subscriberId, localDate, attemptedAt).run();
}
