CREATE TABLE IF NOT EXISTS subscription_feedback (
  id TEXT PRIMARY KEY NOT NULL,
  subscriber_id TEXT NOT NULL,
  poem_date TEXT,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS subscription_feedback_created_idx
  ON subscription_feedback(created_at);

CREATE INDEX IF NOT EXISTS subscription_feedback_subscriber_idx
  ON subscription_feedback(subscriber_id);
