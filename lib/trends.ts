import { generateModernHaiku } from "../app/api/modern-haiku/route.ts";
import type { Haiku, Language } from "../app/haiku.ts";
import type { HaikulyRuntimeEnv } from "./runtime-config.ts";

export type TrendSource = "weibo" | "google_trends_rss";
export type SubscriptionContentMode = "random" | "happening_now";

export type TrendTopic = {
  clusterId: string;
  title: string;
  source: TrendSource;
  region: string;
  regionLabel: string;
  sourceUrl: string;
  windowHours: 24;
  selectedAt: string;
};

export type TrendObservationInput = {
  externalId: string;
  title: string;
  normalizedTitle: string;
  rank: number;
  metric: number;
  startedAt: string | null;
  sourceUrl: string;
  relatedTitles: string[];
};

export type TrendObservationRow = {
  snapshot_id: string;
  source: TrendSource;
  region: string;
  external_id: string;
  title: string;
  normalized_title: string;
  rank: number;
  metric: number;
  started_at: string | null;
  observed_at: string;
  source_url: string;
  related_titles_json: string;
};

type HappeningIssueRow = {
  id: string;
  poem_json: string;
  topic_json: string;
};

const WINDOW_HOURS = 24 as const;
const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000;
const FRESH_SNAPSHOT_MS = 20 * 60 * 1000;
const ISSUE_BUCKET_MS = 3 * 60 * 60 * 1000;
const MAX_FEED_BYTES = 768 * 1024;
const GOOGLE_TRENDS_ORIGIN = "https://trends.google.com";
const WEIBO_ORIGIN = "https://weibo.com";

const TIMEZONE_COUNTRIES: Record<string, string> = {
  "Asia/Shanghai": "CN",
  "Asia/Chongqing": "CN",
  "Asia/Urumqi": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Taipei": "TW",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Singapore": "SG",
  "Asia/Kolkata": "IN",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Australia/Sydney": "AU",
  "Pacific/Auckland": "NZ",
};

const UNSUITABLE_TOPIC = new RegExp(
  [
    "自杀", "轻生", "遗体", "尸体", "强奸", "性侵", "虐杀", "分尸", "血腥",
    "suicide", "killed", "murdered", "rape", "sexual assault", "dead body", "graphic",
  ].join("|"),
  "iu",
);

function isCountryCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{2}$/u.test(value) && value !== "XX";
}

function countryFromLocale(locale: string | null | undefined): string | null {
  if (!locale) return null;
  const match = locale.replace(/_/gu, "-").match(/-([A-Za-z]{2})(?:-|$)/u);
  const country = match?.[1]?.toUpperCase();
  return isCountryCode(country) ? country : null;
}

export function detectedTrendRegion(
  request: Request,
  timezone?: string | null,
  locale?: string | null,
): string {
  const cfCountry = request.cf?.country;
  if (isCountryCode(cfCountry)) return cfCountry;
  const headerCountry = request.headers.get("CF-IPCountry")?.toUpperCase();
  if (isCountryCode(headerCountry)) return headerCountry;
  const localeCountry = countryFromLocale(locale);
  if (localeCountry) return localeCountry;
  if (timezone && TIMEZONE_COUNTRIES[timezone]) return TIMEZONE_COUNTRIES[timezone];
  if (timezone?.startsWith("America/")) return "US";
  return "US";
}

export function trendSourceForRegion(region: string): TrendSource {
  return region === "CN" ? "weibo" : "google_trends_rss";
}

export function trendRegionLabel(region: string, language: Language = "en"): string {
  try {
    const locale = language === "zh" ? "zh-CN" : language;
    return new Intl.DisplayNames([locale], { type: "region" }).of(region) ?? region;
  } catch {
    return region;
  }
}

export function normalizeTrendTitle(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/^#+|#+$/gu, "")
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .toLocaleLowerCase("en-US")
    .slice(0, 160);
}

function xmlText(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gu, "$1")
    .replace(/&apos;/gu, "'")
    .replace(/&quot;/gu, "\"")
    .replace(/&gt;/gu, ">")
    .replace(/&lt;/gu, "<")
    .replace(/&amp;/gu, "&")
    .trim();
}

function tagValue(block: string, tag: string): string | null {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "iu"));
  return match ? xmlText(match[1]) : null;
}

function trafficValue(value: string | null): number {
  if (!value) return 0;
  const compact = value.replace(/[,+\s]/gu, "").toUpperCase();
  const match = compact.match(/^(\d+(?:\.\d+)?)([KMB])?/u);
  if (!match) return 0;
  const multiplier = match[2] === "B" ? 1_000_000_000 : match[2] === "M" ? 1_000_000 : match[2] === "K" ? 1_000 : 1;
  return Math.round(Number(match[1]) * multiplier);
}

export function parseGoogleTrendsRss(
  xml: string,
  region: string,
  observedAt: string,
): TrendObservationInput[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/giu) ?? [];
  return items.slice(0, 50).flatMap((item, index) => {
    const title = tagValue(item, "title")?.slice(0, 160) ?? "";
    const normalizedTitle = normalizeTrendTitle(title);
    if (!normalizedTitle) return [];
    const published = tagValue(item, "pubDate");
    const parsedPublished = published ? new Date(published) : null;
    const startedAt = parsedPublished && !Number.isNaN(parsedPublished.getTime())
      ? parsedPublished.toISOString()
      : null;
    const relatedTitles = (item.match(/<ht:news_item_title>[\s\S]*?<\/ht:news_item_title>/giu) ?? [])
      .map((value) => tagValue(value, "ht:news_item_title") ?? "")
      .filter(Boolean)
      .slice(0, 3);
    return [{
      externalId: normalizedTitle,
      title,
      normalizedTitle,
      rank: index + 1,
      metric: trafficValue(tagValue(item, "ht:approx_traffic")),
      startedAt,
      sourceUrl: `${GOOGLE_TRENDS_ORIGIN}/trending?geo=${encodeURIComponent(region)}`,
      relatedTitles,
      observedAt,
    } as TrendObservationInput & { observedAt: string }];
  });
}

export function parseWeiboHotSearch(
  payload: unknown,
  observedAt: string,
): TrendObservationInput[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  const realtime = (payload as { data?: { realtime?: unknown } }).data?.realtime;
  if (!Array.isArray(realtime)) return [];
  return realtime.slice(0, 50).flatMap((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    if (record.is_ad === 1 || record.is_ad === true) return [];
    const title = typeof record.word === "string" ? record.word.trim().slice(0, 160) : "";
    const normalizedTitle = normalizeTrendTitle(title);
    if (!normalizedTitle) return [];
    return [{
      externalId: normalizedTitle,
      title,
      normalizedTitle,
      rank: index + 1,
      metric: typeof record.num === "number" && Number.isFinite(record.num) ? Math.max(0, record.num) : 0,
      startedAt: null,
      sourceUrl: `${WEIBO_ORIGIN}/weibo?q=${encodeURIComponent(title)}`,
      relatedTitles: [],
      observedAt,
    } as TrendObservationInput & { observedAt: string }];
  });
}

async function readLimitedText(response: Response, maximumBytes = MAX_FEED_BYTES): Promise<string> {
  const declaredLength = Number(response.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) throw new Error("trend_feed_too_large");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let output = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) throw new Error("trend_feed_too_large");
      output += decoder.decode(value, { stream: true });
    }
    return output + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

async function fetchTrendRegion(region: string, observedAt: string): Promise<TrendObservationInput[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    if (region === "CN") {
      const response = await fetch(`${WEIBO_ORIGIN}/ajax/side/hotSearch`, {
        signal: controller.signal,
        headers: {
          Accept: "application/json, text/plain, */*",
          Referer: `${WEIBO_ORIGIN}/hot/search`,
          "User-Agent": "Mozilla/5.0 (compatible; Haikuly/1.0; +https://haikuly.fyi)",
        },
      });
      if (!response.ok) throw new Error(`weibo_${response.status}`);
      return parseWeiboHotSearch(JSON.parse(await readLimitedText(response)), observedAt);
    }
    const response = await fetch(`${GOOGLE_TRENDS_ORIGIN}/trending/rss?geo=${encodeURIComponent(region)}`, {
      signal: controller.signal,
      headers: { Accept: "application/rss+xml, application/xml;q=0.9", "User-Agent": "Haikuly/1.0 (+https://haikuly.fyi)" },
    });
    if (!response.ok) throw new Error(`google_trends_${response.status}`);
    return parseGoogleTrendsRss(await readLimitedText(response), region, observedAt);
  } finally {
    clearTimeout(timeout);
  }
}

export async function collectTrendRegion(
  env: Pick<HaikulyRuntimeEnv, "DB">,
  region: string,
  observedAt = new Date().toISOString(),
): Promise<number> {
  if (!isCountryCode(region)) throw new Error("invalid_trend_region");
  const source = trendSourceForRegion(region);
  const observations = await fetchTrendRegion(region, observedAt);
  if (observations.length === 0) throw new Error("empty_trend_feed");
  const snapshotId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO trend_snapshots (id, source, region, observed_at, item_count, fetch_status) VALUES (?, ?, ?, ?, ?, 'ready')",
  ).bind(snapshotId, source, region, observedAt, observations.length).run();
  await env.DB.batch(observations.map((item) => env.DB.prepare(
    "INSERT INTO trend_observations (snapshot_id, source, region, external_id, title, normalized_title, rank, metric, started_at, observed_at, source_url, related_titles_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(
    snapshotId,
    source,
    region,
    item.externalId,
    item.title,
    item.normalizedTitle,
    item.rank,
    item.metric,
    item.startedAt,
    observedAt,
    item.sourceUrl,
    JSON.stringify(item.relatedTitles),
  )));
  return observations.length;
}

async function hasFreshSnapshot(db: D1Database, region: string, at: Date): Promise<boolean> {
  const freshAfter = new Date(at.getTime() - FRESH_SNAPSHOT_MS).toISOString();
  const row = await db.prepare(
    "SELECT id FROM trend_snapshots WHERE region = ? AND fetch_status = 'ready' AND observed_at >= ? ORDER BY observed_at DESC LIMIT 1",
  ).bind(region, freshAfter).first<{ id: string }>();
  return Boolean(row);
}

export async function ensureTrendRegion(env: Pick<HaikulyRuntimeEnv, "DB">, region: string, at: Date): Promise<void> {
  if (await hasFreshSnapshot(env.DB, region, at)) return;
  await collectTrendRegion(env, region, at.toISOString());
}

function titleTokens(title: string): Set<string> {
  const normalized = title
    .replace(/回应|官宣|发文|热搜|最新|事件|争议|话题|消息|新闻/gu, "")
    .toLocaleLowerCase("en-US");
  const tokens = new Set<string>();
  for (const token of normalized.match(/[a-z0-9]{4,}/giu) ?? []) tokens.add(token);
  const hanRuns = normalized.match(/[\p{Script=Han}]{2,}/gu) ?? [];
  for (const run of hanRuns) {
    const characters = Array.from(run);
    for (let index = 0; index < characters.length - 1; index += 1) {
      tokens.add(`${characters[index]}${characters[index + 1]}`);
    }
  }
  return tokens;
}

function titlesRelated(left: string, right: string): boolean {
  if (left === right) return true;
  if (left.length >= 3 && right.includes(left)) return true;
  if (right.length >= 3 && left.includes(right)) return true;
  const leftTokens = titleTokens(left);
  const rightTokens = titleTokens(right);
  for (const token of leftTokens) if (rightTokens.has(token)) return true;
  return false;
}

function stableClusterId(values: string[]): string {
  const input = [...values].sort().join("|");
  let hash = 2166136261;
  for (const character of input) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `trend-${(hash >>> 0).toString(36)}`;
}

type ScoredGroup = {
  aliases: Set<string>;
  rows: TrendObservationRow[];
};

export function scoreTrendRows(rows: TrendObservationRow[], at: Date): Array<{ topic: TrendTopic; score: number }> {
  const exact = new Map<string, ScoredGroup>();
  for (const row of rows) {
    const group = exact.get(row.normalized_title) ?? { aliases: new Set<string>(), rows: [] };
    group.aliases.add(row.normalized_title);
    group.rows.push(row);
    exact.set(row.normalized_title, group);
  }

  const groups: ScoredGroup[] = [];
  for (const candidate of exact.values()) {
    const matched = groups.find((group) => [...candidate.aliases].some((alias) => [...group.aliases].some((existing) => titlesRelated(alias, existing))));
    if (matched) {
      for (const alias of candidate.aliases) matched.aliases.add(alias);
      matched.rows.push(...candidate.rows);
    } else {
      groups.push(candidate);
    }
  }

  const snapshotMax = new Map<string, number>();
  for (const row of rows) snapshotMax.set(row.snapshot_id, Math.max(snapshotMax.get(row.snapshot_id) ?? 0, row.metric));
  const raw = groups.flatMap((group) => {
    const representative = [...group.rows].sort((a, b) => a.rank - b.rank || b.metric - a.metric)[0];
    if (!representative || UNSUITABLE_TOPIC.test(representative.title)) return [];
    const perSnapshot = new Map<string, { score: number; ageHours: number }>();
    for (const row of group.rows) {
      const ageHours = Math.max(0, (at.getTime() - new Date(row.observed_at).getTime()) / 3_600_000);
      if (!Number.isFinite(ageHours) || ageHours > WINDOW_HOURS) continue;
      const rankScore = 1 / Math.log2(Math.max(2, row.rank + 1));
      const maximum = snapshotMax.get(row.snapshot_id) ?? 0;
      const metricScore = maximum > 0 ? Math.log1p(row.metric) / Math.log1p(maximum) : 0;
      const recency = 0.5 ** (ageHours / 6);
      const score = recency * (0.7 * rankScore + 0.3 * metricScore);
      const current = perSnapshot.get(row.snapshot_id);
      if (!current || score > current.score) perSnapshot.set(row.snapshot_id, { score, ageHours });
    }
    const observations = [...perSnapshot.values()];
    if (observations.length === 0) return [];
    const base = observations.reduce((sum, item) => sum + item.score, 0);
    const persistence = Math.min(1, observations.length / 24);
    const recent = observations.filter((item) => item.ageHours <= 2).reduce((sum, item) => sum + item.score, 0);
    const previous = observations.filter((item) => item.ageHours > 2 && item.ageHours <= 4).reduce((sum, item) => sum + item.score, 0);
    const momentum = Math.min(1, recent / Math.max(0.1, previous * 2));
    return [{ group, representative, base, persistence, momentum }];
  });
  const maximumBase = Math.max(1, ...raw.map((item) => item.base));
  return raw.map((item) => ({
    score: 0.65 * (item.base / maximumBase) + 0.2 * item.persistence + 0.15 * item.momentum,
    topic: {
      clusterId: stableClusterId([...item.group.aliases]),
      title: item.representative.title,
      source: item.representative.source,
      region: item.representative.region,
      regionLabel: trendRegionLabel(item.representative.region),
      sourceUrl: item.representative.source_url,
      windowHours: WINDOW_HOURS,
      selectedAt: at.toISOString(),
    },
  })).sort((left, right) => right.score - left.score);
}

export async function selectTrendTopic(
  db: D1Database,
  region: string,
  at: Date,
  excludedClusterIds: readonly string[] = [],
): Promise<TrendTopic | null> {
  const windowStart = new Date(at.getTime() - WINDOW_MS).toISOString();
  const result = await db.prepare(
    "SELECT snapshot_id, source, region, external_id, title, normalized_title, rank, metric, started_at, observed_at, source_url, related_titles_json FROM trend_observations WHERE region = ? AND observed_at > ? AND observed_at <= ? ORDER BY observed_at DESC LIMIT 5000",
  ).bind(region, windowStart, at.toISOString()).all<TrendObservationRow>();
  const candidates = scoreTrendRows(result.results, at).filter((item) => !excludedClusterIds.includes(item.topic.clusterId));
  return candidates[0]?.topic ?? null;
}

function parseHaiku(value: string): Haiku | null {
  try {
    const parsed = JSON.parse(value) as Partial<Haiku>;
    return Array.isArray(parsed.lines) && parsed.lines.length === 3 && parsed.lines.every((line) => typeof line === "string") &&
      typeof parsed.seed === "number" && typeof parsed.createdAt === "string" && parsed.illustration && typeof parsed.illustration === "object"
      ? parsed as Haiku
      : null;
  } catch {
    return null;
  }
}

function issueBucket(at: Date): string {
  return new Date(Math.floor(at.getTime() / ISSUE_BUCKET_MS) * ISSUE_BUCKET_MS).toISOString();
}

export async function getOrCreateHappeningIssue(
  env: HaikulyRuntimeEnv,
  region: string,
  language: Language,
  at: Date,
): Promise<{ issueId: string; poem: Haiku; topic: TrendTopic } | null> {
  const bucket = issueBucket(at);
  const issueKey = `${trendSourceForRegion(region)}/${region}/${bucket}/${language}`;
  const existing = await env.DB.prepare(
    "SELECT id, poem_json, topic_json FROM happening_issues WHERE issue_key = ? LIMIT 1",
  ).bind(issueKey).first<HappeningIssueRow>();
  if (existing) {
    const poem = parseHaiku(existing.poem_json);
    if (poem) return { issueId: existing.id, poem, topic: JSON.parse(existing.topic_json) as TrendTopic };
  }

  try {
    await ensureTrendRegion(env, region, at);
  } catch (error) {
    console.error(JSON.stringify({ event: "trend_refresh_failed", region, code: error instanceof Error ? error.message : "unknown" }));
  }
  const topic = await selectTrendTopic(env.DB, region, at);
  if (!topic || !env.DEEPSEEK_API_KEY) return null;
  topic.regionLabel = trendRegionLabel(region, language);
  const outcome = await generateModernHaiku({
    mode: "happening",
    tone: "modern",
    language,
    keyword: Array.from(topic.title).slice(0, 48).join(""),
    recentLines: [],
  }, env.DEEPSEEK_API_KEY);
  if (!outcome.ok) return null;
  const issueId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO happening_issues (id, issue_key, source, region, cluster_id, bucket_start, window_start, window_end, language, poem_json, topic_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(
    issueId,
    issueKey,
    topic.source,
    region,
    topic.clusterId,
    bucket,
    new Date(at.getTime() - WINDOW_MS).toISOString(),
    at.toISOString(),
    language,
    JSON.stringify(outcome.haiku),
    JSON.stringify(topic),
    new Date().toISOString(),
  ).run();
  const stored = await env.DB.prepare(
    "SELECT id, poem_json, topic_json FROM happening_issues WHERE issue_key = ? LIMIT 1",
  ).bind(issueKey).first<HappeningIssueRow>();
  const poem = stored ? parseHaiku(stored.poem_json) : null;
  return stored && poem ? { issueId: stored.id, poem, topic: JSON.parse(stored.topic_json) as TrendTopic } : null;
}

async function readJsonRequest(request: Request): Promise<Record<string, unknown> | null> {
  const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > 16_384) return null;
  try {
    const text = await readLimitedText(new Response(request.body), 16_384);
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export async function handleHappeningHaiku(request: Request, env: HaikulyRuntimeEnv): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  const body = await readJsonRequest(request);
  if (!body) return Response.json({ error: "Send a valid JSON request." }, { status: 400 });
  const language: Language = body.language === "zh" || body.language === "ja" ? body.language : "en";
  const timezone = typeof body.timezone === "string" ? body.timezone.slice(0, 64) : null;
  const locale = typeof body.locale === "string" ? body.locale.slice(0, 32) : null;
  const recentLines = Array.isArray(body.recentLines)
    ? body.recentLines.filter((line): line is string => typeof line === "string" && line.length <= 80).slice(0, 15)
    : [];
  const excludedClusterIds = Array.isArray(body.excludeClusterIds)
    ? body.excludeClusterIds.filter((id): id is string => typeof id === "string" && id.length <= 80).slice(0, 10)
    : [];
  const region = detectedTrendRegion(request, timezone, locale);
  const at = new Date();
  try {
    await ensureTrendRegion(env, region, at);
  } catch (error) {
    console.error(JSON.stringify({ event: "trend_refresh_failed", region, code: error instanceof Error ? error.message : "unknown" }));
  }
  const topic = await selectTrendTopic(env.DB, region, at, excludedClusterIds);
  if (!env.DEEPSEEK_API_KEY) return Response.json({ error: "Haiku generation is unavailable." }, { status: 503 });
  const outcome = await generateModernHaiku({
    mode: topic ? "happening" : "random",
    tone: "modern",
    language,
    keyword: topic ? Array.from(topic.title).slice(0, 48).join("") : null,
    recentLines,
  }, env.DEEPSEEK_API_KEY);
  if (!outcome.ok) return Response.json({ error: "Haiku generation is temporarily unavailable." }, { status: 503 });
  if (topic) topic.regionLabel = trendRegionLabel(region, language);
  return Response.json({
    haiku: outcome.haiku,
    source: "deepseek",
    tone: "modern",
    language,
    mode: topic ? "happening" : "random",
    trend: topic,
    fallback: !topic,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function collectActiveTrendRegions(env: Pick<HaikulyRuntimeEnv, "DB">, scheduledTime: number): Promise<void> {
  const result = await env.DB.prepare(
    "SELECT DISTINCT trend_region FROM subscription_members WHERE status = 'active' AND content_mode = 'happening_now' AND trend_region IS NOT NULL ORDER BY trend_region LIMIT 12",
  ).all<{ trend_region: string }>();
  const at = new Date(scheduledTime);
  const regions = result.results.map((row) => row.trend_region).filter(isCountryCode);
  for (let index = 0; index < regions.length; index += 4) {
    await Promise.all(regions.slice(index, index + 4).map(async (region) => {
      try {
        await ensureTrendRegion(env, region, at);
      } catch (error) {
        console.error(JSON.stringify({ event: "trend_collection_failed", region, code: error instanceof Error ? error.message : "unknown" }));
      }
    }));
  }
  const purgeBefore = new Date(at.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("DELETE FROM trend_observations WHERE observed_at < ?").bind(purgeBefore).run();
  await env.DB.prepare("DELETE FROM trend_snapshots WHERE observed_at < ?").bind(purgeBefore).run();
}
