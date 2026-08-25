import assert from "node:assert/strict";
import test from "node:test";
import {
  localDateAt,
  nextLocalDeliveryAt,
  normalizeTimeZone,
  timeZoneFromRequest,
} from "../lib/timezone.ts";

test("normalizes IANA timezones and rejects invalid values", () => {
  assert.equal(normalizeTimeZone(" America/New_York "), "America/New_York");
  assert.ok(normalizeTimeZone("Asia/Kathmandu"));
  assert.equal(normalizeTimeZone("not/a-timezone"), null);
  assert.equal(normalizeTimeZone(""), null);
});

test("uses Cloudflare request timezone only as a fallback", () => {
  const request = new Request("https://haikuly.fyi/api/subscribe");
  Object.defineProperty(request, "cf", { value: { timezone: "Asia/Tokyo" } });
  assert.equal(timeZoneFromRequest(request), "Asia/Tokyo");
  assert.equal(timeZoneFromRequest(new Request("https://haikuly.fyi/api/subscribe")), "UTC");
});

test("schedules 8 AM correctly across the spring DST transition", () => {
  assert.equal(
    nextLocalDeliveryAt("2026-03-07T14:00:00.000Z", "America/New_York"),
    "2026-03-08T12:00:00.000Z",
  );
  assert.equal(
    nextLocalDeliveryAt("2026-03-08T11:59:00.000Z", "America/New_York"),
    "2026-03-08T12:00:00.000Z",
  );
});

test("schedules 8 AM correctly across the fall DST transition", () => {
  assert.equal(
    nextLocalDeliveryAt("2026-10-31T13:00:00.000Z", "America/New_York"),
    "2026-11-01T13:00:00.000Z",
  );
});

test("supports fractional UTC offsets and local delivery dates", () => {
  assert.equal(
    nextLocalDeliveryAt("2026-08-25T02:00:00.000Z", "Asia/Kathmandu"),
    "2026-08-25T02:15:00.000Z",
  );
  assert.equal(localDateAt("2026-08-25T02:15:00.000Z", "Asia/Kathmandu"), "2026-08-25");
  assert.equal(localDateAt("2026-08-25T02:15:00.000Z", "America/Los_Angeles"), "2026-08-24");
});
