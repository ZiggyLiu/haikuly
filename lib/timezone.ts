export const DEFAULT_TIME_ZONE = "UTC";
export const DAILY_DELIVERY_HOUR = 8;

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

export function normalizeTimeZone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 64) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: candidate }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function timeZoneFromRequest(request: Request): string {
  const requestWithCf = request as Request & { cf?: { timezone?: unknown } };
  return normalizeTimeZone(requestWithCf.cf?.timezone) ?? DEFAULT_TIME_ZONE;
}

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

function zonedDateParts(instant: Date, timeZone: string): ZonedDateParts {
  const values = Object.fromEntries(
    formatterFor(timeZone).formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function addLocalDays(parts: Pick<ZonedDateParts, "year" | "month" | "day">, days: number) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function localDateTimeToInstant(parts: ZonedDateParts, timeZone: string): Date {
  const targetAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  let guess = targetAsUtc;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const observed = zonedDateParts(new Date(guess), timeZone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    );
    const adjustment = targetAsUtc - observedAsUtc;
    guess += adjustment;
    if (adjustment === 0) break;
  }
  return new Date(guess);
}

export function localDateAt(instant: Date | number | string, timeZone: string): string {
  const normalized = normalizeTimeZone(timeZone) ?? DEFAULT_TIME_ZONE;
  const parts = zonedDateParts(new Date(instant), normalized);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function nextLocalDeliveryAt(
  from: Date | number | string,
  timeZone: string,
  deliveryHour = DAILY_DELIVERY_HOUR,
): string {
  const normalized = normalizeTimeZone(timeZone) ?? DEFAULT_TIME_ZONE;
  const instant = new Date(from);
  if (!Number.isFinite(instant.getTime())) throw new Error("Invalid scheduling date.");
  const local = zonedDateParts(instant, normalized);
  const beforeDelivery = local.hour < deliveryHour;
  const targetDate = addLocalDays(local, beforeDelivery ? 0 : 1);
  let target = localDateTimeToInstant({
    ...targetDate,
    hour: deliveryHour,
    minute: 0,
    second: 0,
  }, normalized);

  if (target.getTime() <= instant.getTime()) {
    const followingDate = addLocalDays(targetDate, 1);
    target = localDateTimeToInstant({
      ...followingDate,
      hour: deliveryHour,
      minute: 0,
      second: 0,
    }, normalized);
  }
  return target.toISOString();
}
