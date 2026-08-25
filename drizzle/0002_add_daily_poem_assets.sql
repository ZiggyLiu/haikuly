CREATE TABLE IF NOT EXISTS daily_poem_assets (
  send_date TEXT NOT NULL,
  language TEXT NOT NULL,
  renderer_version TEXT NOT NULL,
  object_key TEXT NOT NULL,
  status TEXT NOT NULL,
  sha256 TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  PRIMARY KEY (send_date, language, renderer_version)
);

CREATE INDEX IF NOT EXISTS daily_poem_assets_status_idx
  ON daily_poem_assets(status, send_date);
