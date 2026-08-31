import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("subscriber scheduling migration is indexed and deduplicates each local date", async () => {
  const migration = await readFile(
    new URL("../drizzle/0003_add_subscriber_timezone.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /`timezone` text DEFAULT 'UTC' NOT NULL/);
  assert.match(migration, /subscription_members_status_next_send_idx/);
  assert.match(migration, /PRIMARY KEY \(`subscriber_id`, `local_date`\)/);
});

test("happening-now migration stores regional preferences, rolling observations, and cached issues", async () => {
  const migration = await readFile(
    new URL("../drizzle/0004_add_happening_now.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /`content_mode` text DEFAULT 'random' NOT NULL/);
  assert.match(migration, /`trend_region` text/);
  assert.match(migration, /CREATE TABLE `trend_observations`/);
  assert.match(migration, /trend_observations_region_observed_idx/);
  assert.match(migration, /CREATE TABLE `happening_issues`/);
  assert.match(migration, /CREATE UNIQUE INDEX `happening_issues_issue_key_unique`/);
});

test("dispatcher uses per-subscriber idempotency and a frequent UTC cron", async () => {
  const [dispatcher, store, wrangler, worker] = await Promise.all([
    readFile(new URL("../lib/daily-email.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/subscriber-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);
  assert.match(dispatcher, /`daily\/\$\{subscriber\.id\}\/\$\{sendDate\}\/v2`/);
  assert.doesNotMatch(dispatcher, /sendResendBatch/);
  assert.match(store, /daily_email_deliveries\.status = 'failed'/);
  assert.match(store, /daily_email_deliveries\.status = 'preparing'/);
  assert.match(wrangler, /"crons": \["\*\/15 \* \* \* \*"\]/);
  assert.match(worker, /collectActiveTrendRegions/);
  assert.doesNotMatch(worker, /CF-Connecting-IP/);
});
