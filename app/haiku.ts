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
  neutral: {
    five: ["Soft ink dries slowly", "White paper holds light", "A quiet room waits"],
    seven: ["One phrase rests upon the page", "A thought settles into ink"],
  },
  summer: {
    five: ["Cicadas fill noon", "Heat shimmers at noon", "Tall grass drinks the sun"],
    seven: ["Cicadas stitch the bright air", "Warm wind moves across the field", "The pond holds a cloudless sky"],
  },
  winter: {
    five: ["Snow rests on cedar", "Frost whitens the field", "Cold moon over snow"],
    seven: ["Bare branches gather the snow", "Cold stars sharpen in the night", "The pond sleeps under clear ice"],
  },
  spring: {
    five: ["Plum blossoms open", "New rain wakes the roots", "Green buds hold the light"],
    seven: ["Soft rain opens the garden", "Young leaves gather morning light", "A creek wakes under green shade"],
  },
  autumn: {
    five: ["Red leaves cross the path", "Apples scent the dusk", "Geese call through thin clouds"],
    seven: ["Dry leaves gather by the gate", "Cool wind carries distant geese", "The orchard darkens at dusk"],
  },
  indoor: {
    five: ["Desk lamp warms the room", "Soft rain taps the glass", "Steam rises from tea"],
    seven: ["The clock hums beside the lamp", "The soft rain traces window glass"],
  },
  desert: {
    five: ["Heat shimmers on sand", "Dry wind shapes the dunes", "Stars crowd the desert"],
    seven: ["Warm sand cools beneath the stars", "Night cools the open desert"],
  },
  cave: {
    five: ["Cool stone holds the dark", "Still water echoes", "Darkness fills the cave"],
    seven: ["Slow drops echo through the cave", "A small stream moves under stone"],
  },
  space: {
    five: ["Cold stars fill the dark", "Earth turns far below", "Moon dust holds no wind"],
    seven: ["Stars burn in the silent dark", "Earth turns beneath the black sky"],
  },
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
  4: ["under moonlight", "beside the stream", "through quiet air"],
  5: ["beneath the moonlight", "through quiet gardens", "past the green mountain"],
  6: ["under a silent moon", "in stillness before dawn", "by the old garden gate"],
};

const THEME_WORDS: Record<string, string[]> = {
  summer: ["summer", "hot", "heat", "humid", "cicada", "cicadas", "sunlit", "sunlight"],
  winter: ["winter", "snow", "snowy", "ice", "icy", "frost", "frozen", "cold", "blizzard"],
  spring: ["spring", "blossom", "blossoms", "bloom", "blooms", "thaw", "thawing"],
  autumn: ["autumn", "fall", "harvest"],
  indoor: ["indoor", "indoors", "inside", "office", "room", "desk", "kitchen"],
  desert: ["desert", "dune", "dunes", "sand", "cactus"],
  cave: ["cave", "cavern", "underground"],
  space: ["space", "vacuum", "cosmos", "orbit", "planet", "galaxy"],
  water: ["ocean", "sea", "river", "rain", "lake", "wave", "water", "underwater", "stream", "tide"],
  night: ["night", "moon", "moonlight", "star", "stars", "dark", "dream", "dusk", "evening", "shadow"],
  season: ["season", "seasons"],
  city: ["city", "street", "train", "window", "tower", "traffic", "home"],
  heart: ["love", "hope", "memory", "grief", "joy", "peace", "heart", "friend"],
  earth: ["tree", "forest", "mountain", "stone", "flower", "garden", "bird", "wind"],
};

const CONTEXT_CONFLICTS: Record<string, string[]> = {
  summer: ["winter", "snow", "snowy", "ice", "icy", "frost", "frozen", "blizzard", "cold"],
  winter: ["summer", "hot", "heat", "humid", "cicada", "cicadas"],
  spring: ["autumn", "harvest", "frozen", "blizzard"],
  autumn: ["spring", "blossom", "blossoms", "thaw", "cicada", "cicadas"],
};

const ARTISTIC_FRAMING = [
  "memory",
  "memories",
  "remember",
  "remembers",
  "dream",
  "dreams",
  "ghost",
  "echo",
  "absence",
  "longing",
  "imagines",
  "wishes",
  "though",
  "yet",
  "but",
];

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
    words.some((word) => new RegExp(`\\b${word}\\b`, "i").test(normalized)),
  );
  return (match?.[0] as keyof typeof THEME_LINES) ?? "neutral";
}

export function isSemanticallyCoherent(keyword: string, lines: string[]): boolean {
  const context = detectTheme(keyword);
  const conflicts = CONTEXT_CONFLICTS[context] ?? [];
  if (conflicts.length === 0) return true;

  const normalizedKeyword = keyword.toLowerCase();
  const normalizedPoem = lines.join(" ").toLowerCase();
  const conflictPattern = conflicts.find((word) => new RegExp(`\\b${word}\\b`, "i").test(normalizedPoem));
  if (!conflictPattern) return true;

  const userRequestedContrast = new RegExp(`\\b${conflictPattern}\\b`, "i").test(normalizedKeyword);
  const clearlyFramed = ARTISTIC_FRAMING.some((word) => new RegExp(`\\b${word}\\b`, "i").test(`${normalizedKeyword} ${normalizedPoem}`));
  return userRequestedContrast || clearlyFramed;
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

function keywordAsTextLine(keyword: string): string | null {
  const candidates = [keyword, ...keyword.split(/\s+/)];
  for (const candidate of candidates) {
    const clean = candidate.trim();
    const count = estimateSyllables(clean);
    if (count === 1) return `I write ${clean} on white paper`;
    if (count === 2) return `I write ${clean} on paper`;
    if (count === 3) return `I write ${clean} in ink`;
    if (count === 4) return `I write ${clean} down`;
    if (count === 5) return `I write ${clean}`;
    if (count === 6) return `${clean} waits`;
    if (count === 7) return clean;
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
  const context = detectTheme(keyword);
  const theme = THEME_LINES[context];
  const exactKeywordLine = estimateSyllables(clean) === 7 ? clean : null;
  const middle = exactKeywordLine
    ?? (context === "neutral" ? keywordAsTextLine(clean) : null)
    ?? pick(theme.seven, seed, 2);
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
