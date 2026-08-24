import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const subscribers = sqliteTable("subscription_members", {
  id: text("id").primaryKey(),
  emailCiphertext: text("email_ciphertext").notNull(),
  emailHash: text("email_hash").notNull(),
  language: text("language", { enum: ["en", "zh", "ja"] }).notNull(),
  status: text("status", { enum: ["pending", "active", "unsubscribed"] }).notNull().default("pending"),
  confirmationToken: text("confirmation_token"),
  unsubscribeToken: text("unsubscribe_token"),
  confirmationSentAt: text("confirmation_sent_at"),
  confirmedAt: text("confirmed_at"),
  unsubscribedAt: text("unsubscribed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("subscription_members_email_hash_unique").on(table.emailHash),
  index("subscription_members_status_created_idx").on(table.status, table.createdAt),
]);

export const dailyPoems = sqliteTable("daily_poems", {
  sendDate: text("send_date").notNull(),
  language: text("language", { enum: ["en", "zh", "ja"] }).notNull(),
  poemJson: text("poem_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.sendDate, table.language] }),
]);

export const dailyEmailRuns = sqliteTable("daily_email_runs", {
  runKey: text("run_key").primaryKey(),
  status: text("status", { enum: ["preparing", "sending", "sent", "skipped", "failed"] }).notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  errorCode: text("error_code"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export const emailQuotas = sqliteTable("email_quotas", {
  quotaDate: text("quota_date").primaryKey(),
  confirmationCount: integer("confirmation_count").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const subscriptionFeedback = sqliteTable("subscription_feedback", {
  id: text("id").primaryKey(),
  subscriberId: text("subscriber_id").notNull(),
  poemDate: text("poem_date"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("subscription_feedback_created_idx").on(table.createdAt),
  index("subscription_feedback_subscriber_idx").on(table.subscriberId),
]);
