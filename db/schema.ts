import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const subscribers = sqliteTable("subscription_members", {
  id: text("id").primaryKey(),
  emailCiphertext: text("email_ciphertext").notNull(),
  emailHash: text("email_hash").notNull(),
  language: text("language", { enum: ["en", "zh", "ja"] }).notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  contentMode: text("content_mode", { enum: ["random", "happening_now"] }).notNull().default("random"),
  trendRegion: text("trend_region"),
  regionDetectedAt: text("region_detected_at"),
  regionDetectionMethod: text("region_detection_method"),
  nextSendAt: text("next_send_at"),
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
  index("subscription_members_status_next_send_idx").on(table.status, table.nextSendAt),
  index("subscription_members_trend_region_idx").on(table.status, table.contentMode, table.trendRegion),
]);

export const trendSnapshots = sqliteTable("trend_snapshots", {
  id: text("id").primaryKey(),
  source: text("source", { enum: ["weibo", "google_trends_rss"] }).notNull(),
  region: text("region").notNull(),
  observedAt: text("observed_at").notNull(),
  itemCount: integer("item_count").notNull(),
  fetchStatus: text("fetch_status").notNull(),
}, (table) => [index("trend_snapshots_region_observed_idx").on(table.region, table.observedAt)]);

export const trendObservations = sqliteTable("trend_observations", {
  snapshotId: text("snapshot_id").notNull(),
  source: text("source", { enum: ["weibo", "google_trends_rss"] }).notNull(),
  region: text("region").notNull(),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  normalizedTitle: text("normalized_title").notNull(),
  rank: integer("rank").notNull(),
  metric: integer("metric").notNull().default(0),
  startedAt: text("started_at"),
  observedAt: text("observed_at").notNull(),
  sourceUrl: text("source_url").notNull(),
  relatedTitlesJson: text("related_titles_json").notNull().default("[]"),
}, (table) => [
  primaryKey({ columns: [table.snapshotId, table.externalId] }),
  index("trend_observations_region_observed_idx").on(table.region, table.observedAt),
  index("trend_observations_region_title_idx").on(table.region, table.normalizedTitle, table.observedAt),
]);

export const happeningIssues = sqliteTable("happening_issues", {
  id: text("id").primaryKey(),
  issueKey: text("issue_key").notNull(),
  source: text("source", { enum: ["weibo", "google_trends_rss"] }).notNull(),
  region: text("region").notNull(),
  clusterId: text("cluster_id").notNull(),
  bucketStart: text("bucket_start").notNull(),
  windowStart: text("window_start").notNull(),
  windowEnd: text("window_end").notNull(),
  language: text("language", { enum: ["en", "zh", "ja"] }).notNull(),
  poemJson: text("poem_json").notNull(),
  topicJson: text("topic_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("happening_issues_issue_key_unique").on(table.issueKey),
  index("happening_issues_region_bucket_idx").on(table.region, table.bucketStart),
]);

export const happeningIssueAssets = sqliteTable("happening_issue_assets", {
  issueId: text("issue_id").notNull(),
  language: text("language", { enum: ["en", "zh", "ja"] }).notNull(),
  rendererVersion: text("renderer_version").notNull(),
  objectKey: text("object_key").notNull(),
  status: text("status", { enum: ["generating", "ready", "failed"] }).notNull(),
  sha256: text("sha256"),
  errorCode: text("error_code"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
}, (table) => [primaryKey({ columns: [table.issueId, table.language, table.rendererVersion] })]);

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

export const dailyEmailDeliveries = sqliteTable("daily_email_deliveries", {
  subscriberId: text("subscriber_id").notNull(),
  localDate: text("local_date").notNull(),
  status: text("status", { enum: ["preparing", "sent", "failed"] }).notNull(),
  errorCode: text("error_code"),
  attemptedAt: text("attempted_at").notNull(),
  completedAt: text("completed_at"),
}, (table) => [
  primaryKey({ columns: [table.subscriberId, table.localDate] }),
  index("daily_email_deliveries_status_attempted_idx").on(table.status, table.attemptedAt),
]);

export const dailyPoemAssets = sqliteTable("daily_poem_assets", {
  sendDate: text("send_date").notNull(),
  language: text("language", { enum: ["en", "zh", "ja"] }).notNull(),
  rendererVersion: text("renderer_version").notNull(),
  objectKey: text("object_key").notNull(),
  status: text("status", { enum: ["generating", "ready", "failed"] }).notNull(),
  sha256: text("sha256"),
  errorCode: text("error_code"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
}, (table) => [
  primaryKey({ columns: [table.sendDate, table.language, table.rendererVersion] }),
]);

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
