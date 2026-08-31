ALTER TABLE `subscription_members` ADD `content_mode` text DEFAULT 'random' NOT NULL;
--> statement-breakpoint
ALTER TABLE `subscription_members` ADD `trend_region` text;
--> statement-breakpoint
ALTER TABLE `subscription_members` ADD `region_detected_at` text;
--> statement-breakpoint
ALTER TABLE `subscription_members` ADD `region_detection_method` text;
--> statement-breakpoint
CREATE INDEX `subscription_members_trend_region_idx`
ON `subscription_members` (`status`, `content_mode`, `trend_region`);
--> statement-breakpoint
CREATE TABLE `trend_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `source` text NOT NULL,
  `region` text NOT NULL,
  `observed_at` text NOT NULL,
  `item_count` integer NOT NULL,
  `fetch_status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `trend_snapshots_region_observed_idx`
ON `trend_snapshots` (`region`, `observed_at`);
--> statement-breakpoint
CREATE TABLE `trend_observations` (
  `snapshot_id` text NOT NULL,
  `source` text NOT NULL,
  `region` text NOT NULL,
  `external_id` text NOT NULL,
  `title` text NOT NULL,
  `normalized_title` text NOT NULL,
  `rank` integer NOT NULL,
  `metric` integer DEFAULT 0 NOT NULL,
  `started_at` text,
  `observed_at` text NOT NULL,
  `source_url` text NOT NULL,
  `related_titles_json` text DEFAULT '[]' NOT NULL,
  PRIMARY KEY (`snapshot_id`, `external_id`)
);
--> statement-breakpoint
CREATE INDEX `trend_observations_region_observed_idx`
ON `trend_observations` (`region`, `observed_at`);
--> statement-breakpoint
CREATE INDEX `trend_observations_region_title_idx`
ON `trend_observations` (`region`, `normalized_title`, `observed_at`);
--> statement-breakpoint
CREATE TABLE `happening_issues` (
  `id` text PRIMARY KEY NOT NULL,
  `issue_key` text NOT NULL,
  `source` text NOT NULL,
  `region` text NOT NULL,
  `cluster_id` text NOT NULL,
  `bucket_start` text NOT NULL,
  `window_start` text NOT NULL,
  `window_end` text NOT NULL,
  `language` text NOT NULL,
  `poem_json` text NOT NULL,
  `topic_json` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `happening_issues_issue_key_unique`
ON `happening_issues` (`issue_key`);
--> statement-breakpoint
CREATE INDEX `happening_issues_region_bucket_idx`
ON `happening_issues` (`region`, `bucket_start`);
--> statement-breakpoint
CREATE TABLE `happening_issue_assets` (
  `issue_id` text NOT NULL,
  `language` text NOT NULL,
  `renderer_version` text NOT NULL,
  `object_key` text NOT NULL,
  `status` text NOT NULL,
  `sha256` text,
  `error_code` text,
  `created_at` text NOT NULL,
  `completed_at` text,
  PRIMARY KEY (`issue_id`, `language`, `renderer_version`)
);
