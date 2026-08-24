CREATE TABLE `daily_email_runs` (
	`run_key` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`recipient_count` integer DEFAULT 0 NOT NULL,
	`error_code` text,
	`created_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `daily_poems` (
	`send_date` text NOT NULL,
	`language` text NOT NULL,
	`poem_json` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`send_date`, `language`)
);
--> statement-breakpoint
CREATE TABLE `email_quotas` (
	`quota_date` text PRIMARY KEY NOT NULL,
	`confirmation_count` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription_members` (
	`id` text PRIMARY KEY NOT NULL,
	`email_ciphertext` text NOT NULL,
	`email_hash` text NOT NULL,
	`language` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`confirmation_token` text,
	`unsubscribe_token` text,
	`confirmation_sent_at` text,
	`confirmed_at` text,
	`unsubscribed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_members_email_hash_unique` ON `subscription_members` (`email_hash`);--> statement-breakpoint
CREATE INDEX `subscription_members_status_created_idx` ON `subscription_members` (`status`,`created_at`);
