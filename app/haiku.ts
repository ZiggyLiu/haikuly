export type Mode = "random" | "keyword";
export type GenerationSource = "local" | "openai" | "local-fallback";

export type Haiku = {
  lines: [string, string, string];
  seed: number;
};

export const FIVE_SYLLABLE_LINES = [
  "Morning mist rises",
  "Dusk settles softly",
  "A pale moth takes flight",
  "Moonlight fills the pines",
  "Small waves find the shore",
  "First light warms the stones",
  "Snow rests on cedar",
  "Wild grass leans eastward",
  "A quiet bell rings",
  "Clouds open to blue",
];

export const SEVEN_SYLLABLE_LINES = [
  "The river carries the sky",
  "Rain whispers against the glass",
  "A sparrow crosses the sun",
  "Night gathers under the eaves",
  "Old branches remember spring",
  "The moon drifts through shallow clouds",
  "Wind moves through the open field",
  "One leaf turns in the current",
  "Far thunder softens to rain",
  "The garden listens for dawn",
];

export const THEME_LINES: Record<string, { five: string[]; seven: string[] }> = {
  water: {
    five: ["Small waves find the shore", "Rain darkens the stones", "Mist rises slowly"],
    seven: ["The river carries the sky", "One leaf turns in the current"],
  },
  night: {
    five: ["Moonlight fills the pines", "A pale moth takes flight", "Stars wake one by one"],
    seven: ["Night gathers under the eaves", "The moon drifts through shallow clouds"],
  },
  season: {
    five: ["Snow rests on cedar", "First light warms the stones", "Wild grass leans eastward"],
    seven: ["Old branches remember spring", "The garden listens for dawn"],
  },
  city: {
    five: ["Dusk settles softly", "A quiet bell rings", "Rain darkens the street"],
    seven: ["Rain whispers against the glass", "Far footsteps dissolve in mist"],
  },
  heart: {
    five: ["A quiet bell rings", "Clouds open to blue", "Morning mist rises"],
    seven: ["Old branches remember spring", "Far thunder softens to rain"],
  },
  earth: {
    five: ["Wild grass leans eastward", "Snow rests on cedar", "First light warms the stones"],
    seven: ["Wind moves through the open field", "The garden listens for dawn"],
  },
};

export const KEYWORD_ENDINGS: Record<number, string[]> = {
  0: [""],
  1: ["waits", "glows", "wakes"],
  2: ["drifts on", "at dusk", "in rain"],
  3: ["in soft rain", "under stars", "meets the dawn"],
  4: ["under moonlight", "beside the stream", "through winter rain"],
  5: ["beneath the moonlight", "through quiet gardens", "past the green mountain"],
  6: ["under the autumn moon", "in stillness before dawn", "by the old garden gate"],
};

const THEME_WORDS: Record<string, string[]> = {
  water: ["ocean", "sea", "river", "rain", "lake", "wave", "water", "stream", "tide"],
  night: ["night", "moon", "star", "dark", "dream", "dusk", "evening", "shadow"],
  season: ["spring", "summer", "autumn", "fall", "winter", "snow", "blossom"],
  city: ["city", "street", "train", "window", "tower", "traffic", "home"],
  heart: ["love", "hope", "memory", "grief", "joy", "peace", "heart", "friend"],
  earth: ["tree", "forest", "mountain", "stone", "flower", "garden", "bird", "wind"],
};

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[Math.abs((seed * 9301 + offset * 49297) % items.length)];
}

export function estimateSyllables(text: string): number {
  const exceptions: Record<string, number> = {
    autumn: 2,
    beautiful: 3,
    branches: 2,
    carries: 2,
    crosses: 2,
    evening: 3,
    fire: 1,
    flower: 2,
    moonlight: 2,
    ocean: 2,
    pale: 1,
    poem: 2,
    quiet: 2,
    rises: 2,
    river: 2,
    science: 2,
    settles: 2,
  };

  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .reduce((total, word) => {
      const clean = word.replace(/[^a-z]/g, "");
      if (!clean) return total;
      if (exceptions[clean]) return total + exceptions[clean];
      if (clean.length <= 3) return total + 1;
      const adjusted = clean
        .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, "")
        .replace(/^y/, "");
      const groups = adjusted.match(/[aeiouy]{1,2}/g);
      return total + Math.max(1, groups?.length ?? 1);
    }, 0);
}

export function detectTheme(keyword: string): keyof typeof THEME_LINES {
  const normalized = keyword.toLowerCase();
  const match = Object.entries(THEME_WORDS).find(([, words]) =>
    words.some((word) => normalized.includes(word)),
  );
  return (match?.[0] as keyof typeof THEME_LINES) ?? "earth";
}

export function keywordLine(keyword: string, seed: number): string | null {
  const count = estimateSyllables(keyword);
  if (count < 1 || count > 7) return null;
  const endings = KEYWORD_ENDINGS[7 - count];
  const clean = keyword.trim().replace(/\s+/g, " ");

  for (let offset = 0; offset < endings.length; offset += 1) {
    const ending = pick(endings, seed, 5 + offset);
    const line = `${clean}${ending ? ` ${ending}` : ""}`;
    if (estimateSyllables(line) === 7) return line;
  }
  return null;
}

export function makeRandomHaiku(seed: number): Haiku {
  return {
    lines: [
      pick(FIVE_SYLLABLE_LINES, seed, 1),
      pick(SEVEN_SYLLABLE_LINES, seed, 2),
      pick(FIVE_SYLLABLE_LINES, seed, 3),
    ],
    seed,
  };
}

export function makeKeywordHaiku(keyword: string, seed: number): Haiku | null {
  const clean = keyword.trim();
  if (!clean) return null;
  const theme = THEME_LINES[detectTheme(keyword)];
  const candidates = [clean, ...clean.split(/\s+/)];
  const middle = candidates
    .map((candidate, index) => keywordLine(candidate, seed + index))
    .find((line): line is string => Boolean(line)) ?? pick(theme.seven, seed, 2);
  return {
    lines: [pick(theme.five, seed, 1), middle, pick(theme.five, seed, 3)],
    seed,
  };
}

export function generationSourceLabel(source: GenerationSource): string {
  if (source === "openai") return "Written with OpenAI";
  if (source === "local-fallback") return "Local fallback";
  return "Local generator";
}
