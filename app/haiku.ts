export type Mode = "random" | "keyword";
export type Language = "en" | "zh";
export type GenerationSource = "deepseek";

export type Haiku = {
  lines: [string, string, string];
  seed: number;
};

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
  return estimateSyllables(text);
}

export function poemLineClassName(line: string, index: number, language: Language): string {
  if (language === "zh") return "poem-line";

  const characterCount = Array.from(line).length;
  if (characterCount > 38) return "poem-line line-extra-tight";
  if (characterCount > 30 || (index === 1 && characterCount > 27)) {
    return "poem-line line-tight";
  }
  return "poem-line";
}

export function generationSourceLabel(source: GenerationSource): string {
  const labels: Record<GenerationSource, string> = { deepseek: "Written with DeepSeek" };
  return labels[source];
}
