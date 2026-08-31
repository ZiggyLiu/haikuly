import assert from "node:assert/strict";
import test from "node:test";
import {
  dailyCardUrl,
  dailyImageDownloadUrl,
  dailyImageObjectKey,
  dailyImageUrl,
  happeningCardUrl,
  happeningImageDownloadUrl,
  happeningImageObjectKey,
  happeningImageUrl,
  serveDailyImage,
  serveHappeningImage,
} from "../lib/daily-image.ts";

test("daily image keys and URLs are stable per date and language", () => {
  assert.equal(dailyImageObjectKey("2026-08-23", "zh"), "daily/v1/2026-08-23/zh.png");
  assert.equal(dailyImageUrl("https://haikuly.fyi/", "2026-08-23", "zh"), "https://haikuly.fyi/daily-images/2026-08-23/zh.png");
  assert.equal(dailyImageDownloadUrl("https://haikuly.fyi", "2026-08-23", "zh"), "https://haikuly.fyi/daily-images/2026-08-23/zh.png?download=1");
  assert.equal(dailyCardUrl("https://haikuly.fyi", "2026-08-23", "zh"), "https://haikuly.fyi/daily-card?date=2026-08-23&language=zh&render=1");
});

test("happening image keys and URLs are stable per issue and language", () => {
  const issue = "11111111-1111-4111-8111-111111111111";
  assert.equal(happeningImageObjectKey(issue, "en"), `happening/v1/${issue}/en.png`);
  assert.equal(happeningImageUrl("https://haikuly.fyi/", issue, "en"), `https://haikuly.fyi/happening-images/${issue}/en.png`);
  assert.equal(happeningImageDownloadUrl("https://haikuly.fyi", issue, "en"), `https://haikuly.fyi/happening-images/${issue}/en.png?download=1`);
  assert.equal(happeningCardUrl("https://haikuly.fyi", issue, "en"), `https://haikuly.fyi/daily-card?issue=${issue}&language=en&render=1`);
});

test("daily image route serves immutable PNGs and download disposition", async () => {
  const bytes = new Uint8Array([137, 80, 78, 71]);
  const response = await serveDailyImage(
    new Request("https://haikuly.fyi/daily-images/2026-08-23/en.png?download=1"),
    {
      DAILY_IMAGES: {
        async get(key) {
          assert.equal(key, "daily/v1/2026-08-23/en.png");
          return {
            body: new Response(bytes).body,
            httpEtag: '"image-etag"',
            writeHttpMetadata(headers) { headers.set("content-type", "image/png"); },
          };
        },
      },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("content-disposition"), 'attachment; filename="stillpoint-haiku-2026-08-23.png"');
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
});

test("happening image route serves immutable PNGs", async () => {
  const issue = "11111111-1111-4111-8111-111111111111";
  const response = await serveHappeningImage(
    new Request(`https://haikuly.fyi/happening-images/${issue}/ja.png`),
    {
      DAILY_IMAGES: {
        async get(key) {
          assert.equal(key, `happening/v1/${issue}/ja.png`);
          return {
            body: new Response(new Uint8Array([137, 80, 78, 71])).body,
            httpEtag: '"happening-etag"',
            writeHttpMetadata(headers) { headers.set("content-type", "image/png"); },
          };
        },
      },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
});
