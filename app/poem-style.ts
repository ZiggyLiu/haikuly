import type { Language } from "./haiku";

export type PoemFontOption = {
  id: string;
  label: string;
  family: string;
};

export type PoemStyle = {
  fontId: string;
  fontSize: number;
  lineHeight: number;
  illustrationOpacity: number;
};

export const POEM_STYLE_STORAGE_KEY = "haikuly-poem-styles-v1";

export const POEM_FONT_OPTIONS: Record<Language, readonly PoemFontOption[]> = {
  en: [
    { id: "cormorant", label: "Cormorant", family: 'var(--font-poem-en), "Cormorant Garamond", Georgia, serif' },
    { id: "georgia", label: "Georgia", family: 'Georgia, "Times New Roman", serif' },
    { id: "lato", label: "Lato", family: 'var(--font-lato), Lato, Arial, sans-serif' },
    { id: "dancing", label: "Dancing Script", family: 'var(--font-dancing-script), "Dancing Script", cursive' },
    { id: "geist", label: "Geist", family: 'var(--font-geist-sans), Arial, sans-serif' },
  ],
  zh: [
    { id: "hannotate", label: "Hannotate", family: '"Hannotate SC", Hannotate, "手札", cursive' },
    { id: "fangsong", label: "Fangsong", family: 'Fangsong, STFangsong, "仿宋", serif' },
    { id: "harmonyos", label: "HarmonyOS Sans SC", family: '"HarmonyOS Sans SC", "HarmonyOS Sans", sans-serif' },
    { id: "pingfang", label: "PingFang SC", family: '"PingFang SC", "Hiragino Sans GB", sans-serif' },
  ],
  ja: [
    { id: "shippori", label: "Shippori Mincho", family: 'var(--font-poem-ja), "Shippori Mincho", "Yu Mincho", serif' },
    { id: "yu-mincho", label: "Yu Mincho", family: '"Yu Mincho", YuMincho, "Hiragino Mincho ProN", serif' },
    { id: "hiragino-mincho", label: "Hiragino Mincho", family: '"Hiragino Mincho ProN", "Hiragino Mincho Pro", serif' },
    { id: "hiragino-sans", label: "Hiragino Sans", family: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif' },
    { id: "yu-gothic", label: "Yu Gothic", family: '"Yu Gothic", YuGothic, "Hiragino Kaku Gothic ProN", sans-serif' },
  ],
};

export const DEFAULT_POEM_STYLES: Record<Language, PoemStyle> = {
  en: { fontId: "cormorant", fontSize: 32, lineHeight: 1.35, illustrationOpacity: 0.82 },
  zh: { fontId: "hannotate", fontSize: 24, lineHeight: 1.5, illustrationOpacity: 0.82 },
  ja: { fontId: "shippori", fontSize: 24, lineHeight: 1.5, illustrationOpacity: 0.82 },
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function poemFont(language: Language, fontId: string) {
  return POEM_FONT_OPTIONS[language].find((font) => font.id === fontId) ?? POEM_FONT_OPTIONS[language][0];
}

export function readPoemStyles(value: unknown): Record<Language, PoemStyle> {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<Record<Language, Partial<PoemStyle>>>
    : {};

  return (Object.keys(DEFAULT_POEM_STYLES) as Language[]).reduce((styles, language) => {
    const defaults = DEFAULT_POEM_STYLES[language];
    const candidate = source[language] ?? {};
    const fontId = typeof candidate.fontId === "string" && POEM_FONT_OPTIONS[language].some((font) => font.id === candidate.fontId)
      ? candidate.fontId
      : defaults.fontId;
    styles[language] = {
      fontId,
      fontSize: isFiniteNumber(candidate.fontSize) ? clamp(candidate.fontSize, 16, 44) : defaults.fontSize,
      lineHeight: isFiniteNumber(candidate.lineHeight) ? clamp(candidate.lineHeight, 1.1, 2) : defaults.lineHeight,
      illustrationOpacity: isFiniteNumber(candidate.illustrationOpacity)
        ? clamp(candidate.illustrationOpacity, 0.35, 1)
        : defaults.illustrationOpacity,
    };
    return styles;
  }, {} as Record<Language, PoemStyle>);
}
