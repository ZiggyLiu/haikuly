export type Mode = "random" | "keyword";
export type Language = "en" | "zh" | "ja";
export type GenerationSource = "deepseek";

export const ILLUSTRATION_MOTIFS = [
  "mountains", "river", "pine", "rain", "blossoms",
  "reeds", "shore", "snow", "field", "mist",
] as const;
export const ILLUSTRATION_ACCENTS = ["moon", "sun", "bird", "blossoms", "lantern", "none"] as const;
export const ILLUSTRATION_TONES = ["sage", "blue-gray", "sepia", "plum-gray"] as const;
export const ILLUSTRATION_PLACEMENTS = ["left", "right"] as const;

export type IllustrationRecipe = {
  motif: (typeof ILLUSTRATION_MOTIFS)[number];
  accent: (typeof ILLUSTRATION_ACCENTS)[number];
  tone: (typeof ILLUSTRATION_TONES)[number];
  placement: (typeof ILLUSTRATION_PLACEMENTS)[number];
};

export type Haiku = {
  lines: [string, string, string];
  readings?: [string, string, string];
  seed: number;
  createdAt: string;
  illustration: IllustrationRecipe;
};

const ENGLISH_MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

function localDateParts(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
  };
}

export function haikuDateLabel(createdAt: string, language: Language): string {
  const parts = localDateParts(createdAt);
  if (!parts) return "DATE —";
  if (language === "zh" || language === "ja") {
    return `${parts.year}年${parts.month + 1}月${parts.day}日`;
  }
  return `${ENGLISH_MONTHS[parts.month]} ${parts.day}, ${parts.year}`;
}

export function haikuImageFilename(createdAt: string): string {
  const parts = localDateParts(createdAt);
  if (!parts) return "stillpoint-haiku.png";
  const month = String(parts.month + 1).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `stillpoint-haiku-${parts.year}-${month}-${day}.png`;
}

export function isIllustrationRecipe(value: unknown): value is IllustrationRecipe {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  if (keys.join(",") !== "accent,motif,placement,tone") return false;
  const recipe = value as Record<string, unknown>;
  return ILLUSTRATION_MOTIFS.includes(recipe.motif as IllustrationRecipe["motif"]) &&
    ILLUSTRATION_ACCENTS.includes(recipe.accent as IllustrationRecipe["accent"]) &&
    ILLUSTRATION_TONES.includes(recipe.tone as IllustrationRecipe["tone"]) &&
    ILLUSTRATION_PLACEMENTS.includes(recipe.placement as IllustrationRecipe["placement"]);
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

export function countPoeticUnits(text: string, language: Language): number {
  if (language === "zh") {
    return Array.from(text).filter((character) => /\p{Script=Han}/u.test(character)).length;
  }
  if (language === "ja") return countJapaneseMora(text);
  return estimateSyllables(text);
}

export function countJapaneseMora(reading: string): number {
  const combiningKana = new Set([
    "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "ゎ", "ゕ", "ゖ",
    "ァ", "ィ", "ゥ", "ェ", "ォ", "ャ", "ュ", "ョ", "ヮ", "ヵ", "ヶ",
  ]);
  return Array.from(reading.normalize("NFC")).filter((character) =>
    (/^[\p{Script=Hiragana}\p{Script=Katakana}ー]$/u.test(character) &&
      !combiningKana.has(character)),
  ).length;
}

export function poemLinesClassName(lines: readonly string[], language: Language): string {
  if (language !== "en") return "poem-lines";

  const longestLine = Math.max(...lines.map((line) => Array.from(line).length));
  if (longestLine > 38) return "poem-lines lines-extra-tight";
  if (longestLine > 27) return "poem-lines lines-tight";
  return "poem-lines";
}

export function generationSourceLabel(source: GenerationSource, language: Language = "en"): string {
  const labels: Record<Language, Record<GenerationSource, string>> = {
    en: { deepseek: "Written & painted with DeepSeek" },
    zh: { deepseek: "由 DeepSeek 创作与绘制" },
    ja: { deepseek: "DeepSeekによる作句・描画" },
  };
  return labels[language][source];
}
