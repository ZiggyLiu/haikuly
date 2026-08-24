import type { Language } from "../app/haiku";

export type SubscriberStatus = "pending" | "active" | "unsubscribed";

export type SubscriberRow = {
  id: string;
  email_ciphertext: string;
  email_hash: string;
  language: Language;
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
    "SELECT id, email_ciphertext, email_hash, language, status, confirmation_token, unsubscribe_token, " +
    "confirmation_sent_at, confirmed_at, unsubscribed_at, created_at, updated_at " +
    "FROM subscription_members WHERE email_hash = ? LIMIT 1",
  ).bind(emailHash).first<SubscriberRow>();
}

export async function findSubscriberById(db: D1Database, id: string) {
  return db.prepare(
    "SELECT id, email_ciphertext, email_hash, language, status, confirmation_token, unsubscribe_token, " +
    "confirmation_sent_at, confirmed_at, unsubscribed_at, created_at, updated_at " +
    "FROM subscription_members WHERE id = ? LIMIT 1",
  ).bind(id).first<SubscriberRow>();
}

export async function insertSubscriber(
  db: D1Database,
  row: Pick<SubscriberRow, "id" | "email_ciphertext" | "email_hash" | "language" | "confirmation_token" | "created_at" | "updated_at">,
) {
  await db.prepare(
    "INSERT OR IGNORE INTO subscription_members " +
    "(id, email_ciphertext, email_hash, language, status, confirmation_token, created_at, updated_at) " +
    "VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)",
  ).bind(
    row.id,
    row.email_ciphertext,
    row.email_hash,
    row.language,
    row.confirmation_token,
    row.created_at,
    row.updated_at,
  ).run();
}

export async function updateActiveSubscriberLanguage(
  db: D1Database,
  id: string,
  emailCiphertext: string,
  language: Language,
  updatedAt: string,
) {
  await db.prepare(
    "UPDATE subscription_members SET email_ciphertext = ?, language = ?, updated_at = ? WHERE id = ? AND status = 'active'",
  ).bind(emailCiphertext, language, updatedAt, id).run();
}

export async function preparePendingSubscriber(
  db: D1Database,
  id: string,
  emailCiphertext: string,
  language: Language,
  confirmationToken: string,
  updatedAt: string,
) {
  await db.prepare(
    "UPDATE subscription_members SET email_ciphertext = ?, language = ?, status = 'pending', confirmation_token = ?, " +
    "unsubscribe_token = NULL, confirmation_sent_at = NULL, confirmed_at = NULL, unsubscribed_at = NULL, updated_at = ? " +
    "WHERE id = ?",
  ).bind(emailCiphertext, language, confirmationToken, updatedAt, id).run();
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
  now: string,
) {
  return db.prepare(
    "UPDATE subscription_members SET status = 'active', confirmation_token = NULL, unsubscribe_token = ?, " +
    "confirmed_at = ?, unsubscribed_at = NULL, updated_at = ? " +
    "WHERE id = ? AND status = 'pending' AND confirmation_token = ? RETURNING id",
  ).bind(unsubscribeToken, now, now, id, confirmationToken).first<{ id: string }>();
}

export async function unsubscribeSubscriber(
  db: D1Database,
  id: string,
  unsubscribeToken: string,
  now: string,
) {
  return db.prepare(
    "UPDATE subscription_members SET status = 'unsubscribed', unsubscribed_at = ?, updated_at = ? " +
    "WHERE id = ? AND unsubscribe_token = ? AND status IN ('active', 'unsubscribed') RETURNING id, language",
  ).bind(now, now, id, unsubscribeToken).first<{ id: string; language: Language }>();
}

export async function listActiveSubscribers(db: D1Database, limit: number) {
  const result = await db.prepare(
    "SELECT id, email_ciphertext, language, unsubscribe_token FROM subscription_members " +
    "WHERE status = 'active' AND unsubscribe_token IS NOT NULL ORDER BY created_at ASC LIMIT ?",
  ).bind(limit).all<Pick<SubscriberRow, "id" | "email_ciphertext" | "language" | "unsubscribe_token">>();
  return result.results;
}
