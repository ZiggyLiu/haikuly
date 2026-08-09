export type Mode = "random" | "keyword";
export type GenerationSource = "local" | "openai" | "local-fallback";

export type Haiku = {
  lines: [string, string, string];
  seed: number;
};

type TaggedSetting = { text: string; tags: string[] };
type CompositionImage = { subject: string; actions: string[]; tags: string[] };
type CompositionBank = {
  images: CompositionImage[];
  shortSettings: TaggedSetting[];
  longSettings: TaggedSetting[];
};

const setting = (text: string, ...tags: string[]): TaggedSetting => ({ text, tags });
const image = (subject: string, actions: string[], ...tags: string[]): CompositionImage => ({ subject, actions, tags });

// A line combines a two-syllable subject, a one-syllable compatible action,
// and a tagged two- or four-syllable setting. Tags block unsuitable pairings.
export const LOCAL_COMPOSITION_BANKS: Record<string, CompositionBank> = {
  neutral: {
    images: [image("Soft ink", ["dries", "shines"], "ink"), image("White page", ["waits", "glows"], "page"), image("Calm breath", ["slows", "moves"], "breath"), image("Lamp glow", ["rests", "falls"], "lamp")],
    shortSettings: [setting("in hush", "page", "breath"), setting("at rest", "breath"), setting("by lamps", "ink", "page"), setting("on desks", "ink", "page"), setting("at dusk", "lamp"), setting("near glass", "lamp")],
    longSettings: [setting("beside the lamp", "ink", "page"), setting("on blank paper", "ink"), setting("through the still room", "page", "breath"), setting("under soft light", "ink", "page", "breath"), setting("across the desk", "lamp"), setting("beyond the glass", "lamp")],
  },
  summer: {
    images: [image("Warm wind", ["drifts", "moves"], "air", "field"), image("Tall grass", ["leans", "waves"], "field"), image("Pond light", ["glows", "rests"], "water", "light")],
    shortSettings: [setting("at noon", "air", "field", "water", "light"), setting("through fields", "air", "field"), setting("on ponds", "water", "light"), setting("in shade", "field", "water")],
    longSettings: [setting("across warm fields", "air", "field"), setting("under bright sun", "air", "field", "water", "light"), setting("above the pond", "water", "light"), setting("through the green grass", "air", "field")],
  },
  winter: {
    images: [image("Cold wind", ["drifts", "moves"], "air", "snow"), image("Night frost", ["forms", "spreads"], "frost", "ground"), image("Snow light", ["glows", "rests"], "light", "snow")],
    shortSettings: [setting("through snow", "air", "snow"), setting("on stone", "frost", "ground"), setting("at dusk", "air", "snow", "frost", "ground", "light"), setting("below", "snow", "frost", "ground")],
    longSettings: [setting("across white fields", "air", "snow"), setting("under cold stars", "air", "snow", "frost", "ground", "light"), setting("beside dark pines", "snow", "light"), setting("over still ground", "air", "snow", "frost", "ground", "light")],
  },
  spring: {
    images: [image("New rain", ["falls", "moves"], "rain"), image("Plum bloom", ["wakes", "glows"], "bloom"), image("Creek song", ["flows", "drifts"], "creek")],
    shortSettings: [setting("at dawn", "rain", "bloom", "creek"), setting("through leaves", "rain", "creek"), setting("near roots", "rain", "bloom"), setting("by creeks", "bloom")],
    longSettings: [setting("across green fields", "rain", "creek"), setting("under young leaves", "rain", "bloom", "creek"), setting("beside the creek", "bloom"), setting("through the wet earth", "rain")],
  },
  autumn: {
    images: [image("Red leaves", ["drift", "turn"], "leaf", "air"), image("Cool winds", ["move", "cross"], "air", "field"), image("Geese wings", ["beat", "glide"], "sky", "air")],
    shortSettings: [setting("at dusk", "leaf", "air", "field", "sky"), setting("through clouds", "air", "sky"), setting("on paths", "leaf", "field"), setting("near fields", "leaf", "air", "field", "sky")],
    longSettings: [setting("across dry fields", "leaf", "air", "field", "sky"), setting("under thin clouds", "leaf", "air", "sky"), setting("beside the gate", "leaf", "field"), setting("through the orchard", "leaf", "air", "field")],
  },
  water: {
    images: [image("One wave", ["rolls", "breaks"], "sea", "shore"), image("Soft rain", ["falls", "taps"], "rain", "stone"), image("Pond mist", ["drifts", "lifts"], "pond", "air")],
    shortSettings: [setting("at dawn", "sea", "shore", "rain", "stone", "pond", "air"), setting("on stone", "rain", "stone", "shore"), setting("near reeds", "pond", "shore"), setting("through light", "rain", "pond", "air")],
    longSettings: [setting("along the shore", "sea", "shore"), setting("under moonlight", "sea", "shore", "rain", "stone", "pond", "air"), setting("beside the reeds", "pond", "shore"), setting("against dark glass", "rain", "stone")],
  },
  night: {
    images: [image("Moonlight", ["glows", "rests"], "light", "pine"), image("One moth", ["drifts", "turns"], "air", "light"), image("Night wind", ["moves", "sighs"], "air", "roof")],
    shortSettings: [setting("at dusk", "light", "pine", "air", "roof"), setting("through pines", "light", "pine", "air"), setting("near roofs", "air", "roof"), setting("in clouds", "light", "air")],
    longSettings: [setting("across dark roofs", "light", "air", "roof"), setting("under the eaves", "air", "roof"), setting("through shallow clouds", "light", "air"), setting("above the pines", "light", "pine", "air")],
  },
  indoor: {
    images: [image("Desk light", ["glows", "rests"], "light", "room"), image("One clock", ["ticks", "waits"], "clock", "room"), image("Tea steam", ["drifts", "lifts"], "tea", "air")],
    shortSettings: [setting("at dusk", "light", "room", "clock", "tea", "air"), setting("near glass", "light", "room", "tea", "air"), setting("in rooms", "light", "room", "clock", "air"), setting("by lamps", "light", "room", "clock")],
    longSettings: [setting("beside the lamp", "light", "room", "clock"), setting("through the still room", "light", "room", "tea", "air"), setting("above warm tea", "tea", "air"), setting("beyond the door", "light", "room", "clock", "air")],
  },
  desert: {
    images: [image("Warm sand", ["shifts", "rests"], "ground", "dune"), image("Dry wind", ["moves", "sighs"], "air", "dune"), image("Sun haze", ["glows", "drifts"], "light", "air")],
    shortSettings: [setting("at dusk", "ground", "dune", "air", "light"), setting("in heat", "ground", "dune", "air", "light"), setting("through dunes", "air", "dune"), setting("on stone", "ground", "light")],
    longSettings: [setting("across dry dunes", "ground", "dune", "air"), setting("under bright stars", "ground", "dune", "air", "light"), setting("above warm stone", "air", "light"), setting("beyond the road", "ground", "dune", "air", "light")],
  },
  cave: {
    images: [image("Cool stone", ["waits", "rests"], "ground", "dark"), image("One drop", ["falls", "rings"], "water", "stone"), image("Cave wind", ["moves", "sighs"], "air", "hall")],
    shortSettings: [setting("below", "ground", "dark", "water", "stone", "air", "hall"), setting("in dark", "ground", "dark", "water", "stone", "air", "hall"), setting("through stone", "water", "stone", "air"), setting("near streams", "ground", "water", "stone", "hall")],
    longSettings: [setting("beneath the earth", "ground", "dark", "water", "stone", "air", "hall"), setting("through narrow halls", "water", "air", "hall"), setting("under cold stone", "ground", "dark", "water", "stone"), setting("beyond the light", "ground", "dark", "water", "air", "hall")],
  },
  space: {
    images: [image("Cold stars", ["burn", "glow"], "light", "sky"), image("Far worlds", ["turn", "drift"], "world", "void"), image("Twin moons", ["move", "cross"], "world", "sky")],
    shortSettings: [setting("in dark", "light", "sky", "world", "void"), setting("below", "light", "sky", "world", "void"), setting("through space", "world", "void"), setting("at dawn", "light", "sky", "world")],
    longSettings: [setting("beyond black skies", "light", "sky", "world", "void"), setting("across the void", "world", "void"), setting("above the earth", "light", "sky", "world"), setting("through endless night", "light", "sky", "world", "void")],
  },
  earth: {
    images: [image("Tall grass", ["leans", "waves"], "field", "air"), image("Pine shade", ["rests", "spreads"], "pine", "ground"), image("One bird", ["flies", "waits"], "sky", "path")],
    shortSettings: [setting("at dawn", "field", "air", "pine", "ground", "sky", "path"), setting("on stones", "pine", "ground", "path"), setting("through leaves", "air", "pine", "sky"), setting("by paths", "field", "ground", "sky", "path")],
    longSettings: [setting("across green fields", "field", "air", "sky"), setting("under tall pines", "field", "pine", "ground", "path"), setting("beside the path", "field", "ground", "sky", "path"), setting("beyond the hill", "field", "air", "sky", "path")],
  },
  city: {
    images: [image("Street lights", ["glow", "blink"], "light", "street"), image("Train wheels", ["turn", "hum"], "train", "street"), image("Footsteps", ["fade", "cross"], "street", "rain")],
    shortSettings: [setting("at dusk", "light", "street", "train", "rain"), setting("through streets", "street", "train", "rain"), setting("near glass", "light", "street", "rain"), setting("below", "light", "street", "train", "rain")],
    longSettings: [setting("beneath tall signs", "light", "street", "train", "rain"), setting("along wet streets", "light", "street", "train", "rain"), setting("beyond the glass", "light", "street", "train", "rain"), setting("under dim lights", "street", "train", "rain")],
  },
  heart: {
    images: [image("Old grief", ["waits", "fades"], "grief", "time"), image("New hope", ["wakes", "grows"], "hope", "light"), image("One wish", ["drifts", "glows"], "dream", "light")],
    shortSettings: [setting("at dawn", "grief", "time", "hope", "light", "dream"), setting("in dreams", "grief", "time", "hope", "dream"), setting("through years", "grief", "time", "hope", "dream"), setting("at rest", "grief", "time", "hope", "light", "dream")],
    longSettings: [setting("beneath soft rain", "grief", "time", "hope", "dream"), setting("beyond the night", "grief", "time", "hope", "light", "dream"), setting("under warm light", "grief", "hope", "light", "dream"), setting("across still years", "grief", "time", "hope", "dream")],
  },
  season: {
    images: [image("Year light", ["glows", "turns"], "time", "light"), image("Time wind", ["moves", "turns"], "time", "air"), image("Day length", ["shifts", "grows"], "time", "light")],
    shortSettings: [setting("at dawn", "time", "light", "air"), setting("in fields", "time", "light", "air"), setting("through months", "time", "light", "air"), setting("on trees", "time", "light", "air")],
    longSettings: [setting("across the year", "time", "light", "air"), setting("under changed skies", "time", "light", "air"), setting("beyond the sun", "time", "light", "air"), setting("through the long year", "time", "light", "air")],
  },
};

const COMPOSITION_THEME: Record<string, keyof typeof LOCAL_COMPOSITION_BANKS> = {
  neutral: "neutral", summer: "summer", winter: "winter", spring: "spring", autumn: "autumn",
  indoor: "indoor", desert: "desert", cave: "cave", space: "space", water: "water", night: "night",
  season: "season", city: "city", heart: "heart", earth: "earth",
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
  let mixed = (Math.trunc(seed) ^ Math.imul(offset + 1, 0x9e3779b1)) >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return items[(mixed >>> 0) % items.length];
}

function sharesContentWord(left: string, right: string): boolean {
  const words = (text: string) => text
    .toLowerCase()
    .match(/[a-z]+/g)
    ?.filter((word) => word.length > 3)
    .map((word) => word.endsWith("s") ? word.slice(0, -1) : word) ?? [];
  const leftWords = new Set(words(left));
  return words(right).some((word) => leftWords.has(word));
}

function composeLine(
  bank: CompositionBank,
  syllables: 5 | 7,
  seed: number,
  offset: number,
  excludedSubjects: string[] = [],
  excludedActions: string[] = [],
  excludedSettings: string[] = [],
): { line: string; subject: string; action: string; setting: string } {
  const availableImages = bank.images.filter((entry) => !excludedSubjects.includes(entry.subject));
  const selectedImage = pick(availableImages.length > 0 ? availableImages : bank.images, seed, offset);
  const availableActions = selectedImage.actions.filter((action) => !excludedActions.includes(action));
  const action = pick(availableActions.length > 0 ? availableActions : selectedImage.actions, seed, offset + 11);
  const settings = syllables === 5 ? bank.shortSettings : bank.longSettings;
  const compatibleSettings = settings.filter((candidate) =>
    candidate.tags.some((tag) => selectedImage.tags.includes(tag))
      && !excludedSettings.includes(candidate.text)
      && !sharesContentWord(selectedImage.subject, candidate.text),
  );
  const fallbackSettings = settings.filter((candidate) =>
    candidate.tags.some((tag) => selectedImage.tags.includes(tag))
      && !sharesContentWord(selectedImage.subject, candidate.text),
  );
  const selectedSetting = pick(
    compatibleSettings.length > 0 ? compatibleSettings : fallbackSettings.length > 0 ? fallbackSettings : settings,
    seed,
    offset + 23,
  );
  return {
    line: `${selectedImage.subject} ${action} ${selectedSetting.text}`,
    subject: selectedImage.subject,
    action,
    setting: selectedSetting.text,
  };
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

export function detectTheme(keyword: string): keyof typeof COMPOSITION_THEME {
  const normalized = keyword.toLowerCase();
  const match = Object.entries(THEME_WORDS).find(([, words]) =>
    words.some((word) => new RegExp(`\\b${word}\\b`, "i").test(normalized)),
  );
  return (match?.[0] as keyof typeof COMPOSITION_THEME) ?? "neutral";
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
  const contexts = Object.keys(LOCAL_COMPOSITION_BANKS);
  const bank = LOCAL_COMPOSITION_BANKS[pick(contexts, seed, 0)];
  const first = composeLine(bank, 5, seed, 1);
  const middle = composeLine(bank, 7, seed, 2, [first.subject], [first.action], [first.setting]);
  const last = composeLine(
    bank,
    5,
    seed,
    3,
    [first.subject, middle.subject],
    [first.action, middle.action],
    [first.setting, middle.setting],
  );
  return {
    lines: [first.line, middle.line, last.line],
    seed,
  };
}

export function makeKeywordHaiku(keyword: string, seed: number): Haiku | null {
  const clean = keyword.trim();
  if (!clean) return null;
  const context = detectTheme(keyword);
  const bank = LOCAL_COMPOSITION_BANKS[COMPOSITION_THEME[context] ?? "neutral"];
  const exactKeywordLine = estimateSyllables(clean) === 7 ? clean : null;
  const keywordTextLine = context === "neutral" ? keywordAsTextLine(clean) : null;
  const composedMiddle = exactKeywordLine || keywordTextLine ? null : composeLine(bank, 7, seed, 2);
  const middle = exactKeywordLine ?? keywordTextLine ?? composedMiddle?.line ?? composeLine(bank, 7, seed, 2).line;
  const first = composeLine(
    bank,
    5,
    seed,
    1,
    composedMiddle ? [composedMiddle.subject] : [],
    composedMiddle ? [composedMiddle.action] : [],
    composedMiddle ? [composedMiddle.setting] : [],
  );
  const last = composeLine(
    bank,
    5,
    seed,
    3,
    composedMiddle ? [first.subject, composedMiddle.subject] : [first.subject],
    composedMiddle ? [first.action, composedMiddle.action] : [first.action],
    composedMiddle ? [first.setting, composedMiddle.setting] : [first.setting],
  );
  return {
    lines: [first.line, middle, last.line],
    seed,
  };
}

export function generationSourceLabel(source: GenerationSource): string {
  if (source === "openai") return "Written with OpenAI";
  if (source === "local-fallback") return "Local fallback";
  return "Local generator";
}
