ALTER TABLE `subscription_members` ADD `timezone` text DEFAULT 'UTC' NOT NULL;
--> statement-breakpoint
ALTER TABLE `subscription_members` ADD `next_send_at` text;
--> statement-breakpoint
UPDATE `subscription_members`
SET `next_send_at` = CASE
  WHEN strftime('%H:%M:%S', 'now') < '08:00:00'
    THEN strftime('%Y-%m-%dT08:00:00.000Z', 'now')
  ELSE strftime('%Y-%m-%dT08:00:00.000Z', 'now', '+1 day')
END
WHERE `status` = 'active';
--> statement-breakpoint
CREATE INDEX `subscription_members_status_next_send_idx`
ON `subscription_members` (`status`, `next_send_at`);
--> statement-breakpoint
CREATE TABLE `daily_email_deliveries` (
  `subscriber_id` text NOT NULL,
  `local_date` text NOT NULL,
  `status` text NOT NULL,
  `error_code` text,
  `attempted_at` text NOT NULL,
  `completed_at` text,
  PRIMARY KEY (`subscriber_id`, `local_date`)
);
--> statement-breakpoint
CREATE INDEX `daily_email_deliveries_status_attempted_idx`
ON `daily_email_deliveries` (`status`, `attempted_at`);
