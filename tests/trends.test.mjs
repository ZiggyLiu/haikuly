import assert from "node:assert/strict";
import test from "node:test";
import {
  detectedTrendRegion,
  normalizeTrendTitle,
  parseGoogleTrendsRss,
  parseWeiboHotSearch,
  scoreTrendRows,
  trendSourceForRegion,
} from "../lib/trends.ts";

const observedAt = "2026-08-30T12:00:00.000Z";

test("automatic trend region prefers Cloudflare country and has privacy-preserving fallbacks", () => {
  const cfRequest = new Request("https://haikuly.fyi/api/happening-haiku");
  Object.defineProperty(cfRequest, "cf", { value: { country: "CN" } });
  assert.equal(detectedTrendRegion(cfRequest, "America/New_York", "en-US"), "CN");

  const headerRequest = new Request("https://haikuly.fyi/api/happening-haiku", {
    headers: { "CF-IPCountry": "JP" },
  });
  assert.equal(detectedTrendRegion(headerRequest, "America/New_York", "en-US"), "JP");
  assert.equal(detectedTrendRegion(new Request("https://haikuly.fyi"), "Asia/Shanghai", "zh"), "CN");
  assert.equal(detectedTrendRegion(new Request("https://haikuly.fyi"), null, "fr-FR"), "FR");
  assert.equal(trendSourceForRegion("CN"), "weibo");
  assert.equal(trendSourceForRegion("US"), "google_trends_rss");
});

test("Google Trending Now RSS parser extracts rank, traffic, time, and related coverage", () => {
  const xml = `<?xml version="1.0"?><rss xmlns:ht="https://trends.google.com/trending/rss"><channel>
    <item><title>Solar eclipse</title><ht:approx_traffic>200K+</ht:approx_traffic><pubDate>Sun, 30 Aug 2026 10:00:00 GMT</pubDate>
      <ht:news_item><ht:news_item_title>Where the eclipse is visible</ht:news_item_title></ht:news_item>
    </item>
    <item><title><![CDATA[US Open tennis]]></title><ht:approx_traffic>5,000+</ht:approx_traffic></item>
  </channel></rss>`;
  const rows = parseGoogleTrendsRss(xml, "US", observedAt);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    externalId: "solareclipse",
    title: "Solar eclipse",
    normalizedTitle: "solareclipse",
    rank: 1,
    metric: 200_000,
    startedAt: "2026-08-30T10:00:00.000Z",
    sourceUrl: "https://trends.google.com/trending?geo=US",
    relatedTitles: ["Where the eclipse is visible"],
    observedAt,
  });
  assert.equal(rows[1].metric, 5_000);
});

test("Weibo parser removes ads while preserving live popularity signals", () => {
  const rows = parseWeiboHotSearch({
    data: { realtime: [
      { word: "广告话题", num: 999999, is_ad: 1 },
      { word: "景甜回应", num: 876543 },
      { word: "孙宇晨发文", num: 765432 },
    ] },
  }, observedAt);
  assert.deepEqual(rows.map((row) => row.title), ["景甜回应", "孙宇晨发文"]);
  assert.equal(rows[0].rank, 2);
  assert.equal(rows[0].metric, 876543);
  assert.match(rows[0].sourceUrl, /weibo\.com\/weibo\?q=/);
});

test("rolling 24-hour scoring clusters related titles and drops stale or unsafe topics", () => {
  const at = new Date(observedAt);
  const row = (overrides) => ({
    snapshot_id: "snapshot-1",
    source: "weibo",
    region: "CN",
    external_id: "景甜回应",
    title: "景甜回应",
    normalized_title: normalizeTrendTitle("景甜回应"),
    rank: 1,
    metric: 900_000,
    started_at: null,
    observed_at: "2026-08-30T11:50:00.000Z",
    source_url: "https://weibo.com/weibo?q=test",
    related_titles_json: "[]",
    ...overrides,
  });
  const scored = scoreTrendRows([
    row({}),
    row({ snapshot_id: "snapshot-2", title: "景甜发文", normalized_title: normalizeTrendTitle("景甜发文"), rank: 2, observed_at: "2026-08-30T10:00:00.000Z" }),
    row({ snapshot_id: "snapshot-old", title: "无关旧闻", normalized_title: normalizeTrendTitle("无关旧闻"), observed_at: "2026-08-29T10:00:00.000Z" }),
    row({ snapshot_id: "snapshot-unsafe", title: "血腥案件", normalized_title: normalizeTrendTitle("血腥案件"), rank: 1 }),
  ], at);

  assert.equal(scored.length, 1);
  assert.match(scored[0].topic.title, /^景甜/);
  assert.equal(scored[0].topic.windowHours, 24);
  assert.equal(scored[0].topic.region, "CN");
});
