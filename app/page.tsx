"use client";

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import InkWashIllustration from "./ink-wash";
import {
  haikuDateLabel,
  haikuImageFilename,
  poemLinesClassName,
  type GenerationSource,
  type Haiku,
  type Language,
  type Mode,
} from "./haiku";

function setCanvasFont(context: CanvasRenderingContext2D, style: CSSStyleDeclaration) {
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.fillStyle = style.color;
  context.textAlign = "left";
  context.textBaseline = "top";
}

function elementPosition(element: Element, paperBounds: DOMRect) {
  const bounds = element.getBoundingClientRect();
  return { x: bounds.left - paperBounds.left, y: bounds.top - paperBounds.top };
}

function pngFileFromCanvas(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL("image/png");
  const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return {
    dataUrl,
    file: new File([bytes], filename, { type: "image/png", lastModified: Date.now() }),
  };
}

const UI_COPY: Record<Language, {
  languageLabel: string;
  languageRule: string;
  languageGroup: string;
  modeGroup: string;
  randomMode: string;
  keywordMode: string;
  keywordPrompt: string;
  keywordPlaceholder: string;
  keywordError: string;
  emptyPoem: string;
  save: string;
  saved: string;
  saveAria: string;
  saveError: string;
  generateRandom: string;
  generateKeyword: string;
  generating: string;
  generationError: string;
  unreachableError: string;
}> = {
  en: {
    languageLabel: "Poem language",
    languageRule: "5 · 7 · 5 syllables",
    languageGroup: "Poem language",
    modeGroup: "Generation mode",
    randomMode: "By chance",
    keywordMode: "From a word",
    keywordPrompt: "What is on your mind?",
    keywordPlaceholder: "moonlight, first snow, home…",
    keywordError: "Enter a word or short phrase first.",
    emptyPoem: "Your next small moment will appear here.",
    save: "Save Haiku",
    saved: "Saved",
    saveAria: "Save haiku as a picture",
    saveError: "The haiku image could not be saved. Please try again.",
    generateRandom: "Write a haiku",
    generateKeyword: "Write my haiku",
    generating: "Writing, reviewing, and painting…",
    generationError: "DeepSeek could not write a poem. Please try again.",
    unreachableError: "DeepSeek could not be reached. Please try again.",
  },
  zh: {
    languageLabel: "诗歌语言",
    languageRule: "5 · 7 · 5 字",
    languageGroup: "诗歌语言",
    modeGroup: "生成方式",
    randomMode: "随机生成",
    keywordMode: "关键词生成",
    keywordPrompt: "此刻你在想什么？",
    keywordPlaceholder: "月光，初雪，故乡…",
    keywordError: "请先输入一个词或短语。",
    emptyPoem: "下一刻诗意将在此浮现。",
    save: "保存俳句",
    saved: "已保存",
    saveAria: "将俳句保存为图片",
    saveError: "无法保存俳句图片，请重试。",
    generateRandom: "写一首俳句",
    generateKeyword: "写我的俳句",
    generating: "正在创作、审校与绘制…",
    generationError: "DeepSeek 暂时无法创作俳句，请重试。",
    unreachableError: "暂时无法连接 DeepSeek，请重试。",
  },
  ja: {
    languageLabel: "俳句の言語",
    languageRule: "5 · 7 · 5 音",
    languageGroup: "俳句の言語",
    modeGroup: "作句方法",
    randomMode: "おまかせ",
    keywordMode: "言葉から",
    keywordPrompt: "今、心にあるものは？",
    keywordPlaceholder: "月明かり、初雪、故郷…",
    keywordError: "言葉または短いフレーズを入力してください。",
    emptyPoem: "次の小さな瞬間がここに現れます。",
    save: "俳句を保存",
    saved: "保存しました",
    saveAria: "俳句を画像として保存",
    saveError: "俳句の画像を保存できませんでした。もう一度お試しください。",
    generateRandom: "俳句を詠む",
    generateKeyword: "私の俳句を詠む",
    generating: "作句・推敲・描画中…",
    generationError: "DeepSeekが俳句を作れませんでした。もう一度お試しください。",
    unreachableError: "DeepSeekに接続できませんでした。もう一度お試しください。",
  },
};

function languageTag(language: Language) {
  if (language === "zh") return "zh-CN";
  if (language === "ja") return "ja";
  return "en";
}

type DisplayedHaiku = {
  haiku: Haiku;
  source: GenerationSource;
  language: Language;
};

type FallbackSnapshot = {
  mode: Mode;
  language: Language;
  keyword: string;
  error: string;
  generating: boolean;
  haiku: Haiku | null;
  haikuLanguage: Language;
};

function readFallbackSnapshot(): FallbackSnapshot | null {
  if (typeof window === "undefined") return null;
  const runtimeWindow = window as Window & {
    __STILLPOINT_FALLBACK_ACTIVE__?: boolean;
    __STILLPOINT_FALLBACK_STATE__?: FallbackSnapshot;
  };
  return runtimeWindow.__STILLPOINT_FALLBACK_ACTIVE__
    ? runtimeWindow.__STILLPOINT_FALLBACK_STATE__ ?? null
    : null;
}

export default function Home() {
  const [fallbackSnapshot] = useState(readFallbackSnapshot);
  const [mode, setMode] = useState<Mode>(fallbackSnapshot?.mode ?? "random");
  const [language, setLanguage] = useState<Language>(fallbackSnapshot?.language ?? "en");
  const [keyword, setKeyword] = useState(fallbackSnapshot?.keyword ?? "");
  const [error, setError] = useState(fallbackSnapshot?.error ?? "");
  const [saved, setSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(fallbackSnapshot?.generating ?? false);
  const poemPaperRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState<DisplayedHaiku | null>(() => (
    fallbackSnapshot?.haiku
      ? {
          haiku: fallbackSnapshot.haiku,
          source: "deepseek",
          language: fallbackSnapshot.haikuLanguage,
        }
      : null
  ));
  const haiku = displayed?.haiku ?? null;
  const copy = UI_COPY[language];

  useLayoutEffect(() => {
    const runtimeWindow = window as Window & {
      __STILLPOINT_FALLBACK_ACTIVE__?: boolean;
      __STILLPOINT_REACT_READY__?: boolean;
    };
    if (runtimeWindow.__STILLPOINT_FALLBACK_ACTIVE__) return;
    runtimeWindow.__STILLPOINT_REACT_READY__ = true;

    return () => {
      runtimeWindow.__STILLPOINT_REACT_READY__ = false;
    };
  }, []);

  useEffect(() => {
    const refreshRestoredPage = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };

    window.addEventListener("pageshow", refreshRestoredPage);
    return () => window.removeEventListener("pageshow", refreshRestoredPage);
  }, []);

  async function generate(event?: FormEvent) {
    event?.preventDefault();
    setSaved(false);

    if (mode === "keyword" && !keyword.trim()) {
      setError(copy.keywordError);
      return;
    }

    setIsGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/haiku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          language,
          ...(mode === "keyword" ? { keyword: keyword.trim() } : {}),
        }),
      });
      const result = (await response.json()) as {
        haiku?: Haiku;
        error?: string;
        source?: GenerationSource;
        language?: Language;
      };
      if (!response.ok || !result.haiku) {
        setError(language === "en" ? (result.error ?? copy.generationError) : copy.generationError);
        return;
      }
      setDisplayed({ haiku: result.haiku, source: "deepseek", language: result.language ?? language });
    } catch {
      setError(copy.unreachableError);
      return;
    } finally {
      setIsGenerating(false);
    }
    setError("");
  }

  async function saveHaiku() {
    const paper = poemPaperRef.current;
    if (!haiku || !paper) return;

    try {
      const paperBounds = paper.getBoundingClientRect();
      const width = Math.round(paperBounds.width);
      const height = Math.round(paperBounds.height);
      if (width <= 0 || height <= 0) throw new Error("The haiku card is not ready.");

      const scale = Math.min(3, 2048 / Math.max(width, height));
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = Math.round(width * scale);
      exportCanvas.height = Math.round(height * scale);
      const context = exportCanvas.getContext("2d");
      if (!context) throw new Error("Image export is not available.");
      context.setTransform(scale, 0, 0, scale, 0, 0);

      context.fillStyle = "#f8f5ed";
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "rgba(54, 83, 71, 0.025)";
      context.lineWidth = 1;
      for (let y = 30; y < height; y += 30) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      const illustration = paper.querySelector<HTMLCanvasElement>(".ink-wash-canvas");
      if (illustration && illustration.width > 0 && illustration.height > 0) {
        context.save();
        context.globalAlpha = 0.82;
        context.drawImage(illustration, 0, 0, width, height);
        context.restore();
      }

      const readabilityWash = context.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.55,
      );
      readabilityWash.addColorStop(0, "rgba(248, 245, 237, 0.42)");
      readabilityWash.addColorStop(0.55, "rgba(248, 245, 237, 0.2)");
      readabilityWash.addColorStop(1, "rgba(248, 245, 237, 0)");
      context.fillStyle = readabilityWash;
      context.fillRect(0, 0, width, height);

      const seal = paper.querySelector<HTMLElement>(".sun-seal");
      if (seal) {
        const sealBounds = seal.getBoundingClientRect();
        const sealPosition = elementPosition(seal, paperBounds);
        const centerX = sealPosition.x + sealBounds.width / 2;
        const centerY = sealPosition.y + sealBounds.height / 2;
        context.strokeStyle = "rgba(201, 111, 76, 0.13)";
        context.fillStyle = "rgba(201, 111, 76, 0.04)";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(centerX, centerY, sealBounds.width / 2, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.beginPath();
        context.arc(centerX, centerY, sealBounds.width * 0.16, 0, Math.PI * 2);
        context.stroke();

        const sealLabel = seal.querySelector<HTMLElement>(".sun-seal-label");
        if (sealLabel) {
          const labelStyle = window.getComputedStyle(sealLabel);
          const lineHeight = Number.parseFloat(labelStyle.lineHeight) || 10;
          setCanvasFont(context, labelStyle);
          context.textAlign = "center";
          context.fillText("Haiku-", centerX, centerY - lineHeight);
          context.fillText("ly", centerX, centerY);
        }
      }

      const date = paper.querySelector<HTMLElement>(".paper-date");
      if (date) {
        const position = elementPosition(date, paperBounds);
        const style = window.getComputedStyle(date);
        setCanvasFont(context, style);
        context.fillText(date.textContent?.trim() ?? "", position.x, position.y);
      }

      paper.querySelectorAll<HTMLElement>(".poem-line p").forEach((line) => {
        const position = elementPosition(line, paperBounds);
        const style = window.getComputedStyle(line);
        setCanvasFont(context, style);
        context.shadowColor = "rgba(248, 245, 237, 0.9)";
        context.shadowBlur = 12;
        context.shadowOffsetY = 1;
        context.fillText(line.textContent ?? "", position.x, position.y, width - position.x - 20);
        context.shadowColor = "transparent";
        context.shadowBlur = 0;
        context.shadowOffsetY = 0;
      });

      const footer = paper.querySelector<HTMLElement>(".paper-footer");
      if (footer) {
        const footerPosition = elementPosition(footer, paperBounds);
        context.strokeStyle = "rgba(54, 83, 71, 0.17)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(footerPosition.x, footerPosition.y);
        context.lineTo(width - footerPosition.x, footerPosition.y);
        context.stroke();

        footer.querySelectorAll<HTMLElement>("span").forEach((label) => {
          const position = elementPosition(label, paperBounds);
          const style = window.getComputedStyle(label);
          setCanvasFont(context, style);
          const text = label.textContent ?? "";
          context.fillText(text, position.x, position.y);
        });
      }

      context.strokeStyle = "rgba(54, 83, 71, 0.13)";
      context.lineWidth = 1;
      context.strokeRect(0.5, 0.5, width - 1, height - 1);

      const filename = haikuImageFilename(haiku.createdAt);
      const image = pngFileFromCanvas(exportCanvas, filename);
      const shareData = { files: [image.file] };
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare(shareData)
      ) {
        try {
          await navigator.share(shareData);
          return;
        } catch (shareError) {
          if (shareError instanceof DOMException && shareError.name === "AbortError") return;
        }
      }

      const link = document.createElement("a");
      link.href = image.dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setError(copy.saveError);
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setSaved(false);
  }

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setError("");
    setSaved(false);
  }

  return (
    <main className="page-shell" id="stillpoint-app">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Stillpoint home">
          <span className="brand-mark" aria-hidden="true">間</span>
          <span>Stillpoint</span>
        </a>
        <span className="header-note">A haiku studio</span>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">Make room for a small moment</p>
        <h1>Three lines.<br /><em>One quiet world.</em></h1>
        <p className="intro">
          Find a poem and its quiet ink-wash world by chance, or begin with a word already on your mind.
        </p>
      </section>

      <section className="studio" aria-label="Haiku generator">
        <div className="language-control">
          <span className="language-label">{copy.languageLabel}</span>
          <div className="language-switch" role="group" aria-label={copy.languageGroup}>
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              aria-pressed={language === "en"}
              onClick={() => changeLanguage("en")}
              data-language="en"
            >
              English
            </button>
            <button
              type="button"
              className={language === "zh" ? "active" : ""}
              aria-pressed={language === "zh"}
              onClick={() => changeLanguage("zh")}
              lang="zh-CN"
              data-language="zh"
            >
              中文
            </button>
            <button
              type="button"
              className={language === "ja" ? "active" : ""}
              aria-pressed={language === "ja"}
              onClick={() => changeLanguage("ja")}
              lang="ja"
              data-language="ja"
            >
              日本語
            </button>
          </div>
          <span className="language-rule">{copy.languageRule}</span>
        </div>

        <div className="mode-switch" role="group" aria-label={copy.modeGroup}>
          <button
            type="button"
            className={mode === "random" ? "active" : ""}
            aria-pressed={mode === "random"}
            onClick={() => changeMode("random")}
            data-mode="random"
          >
            <span aria-hidden="true">✦</span> {copy.randomMode}
          </button>
          <button
            type="button"
            className={mode === "keyword" ? "active" : ""}
            aria-pressed={mode === "keyword"}
            onClick={() => changeMode("keyword")}
            data-mode="keyword"
          >
            <span aria-hidden="true">⌁</span> {copy.keywordMode}
          </button>
        </div>

        <form onSubmit={generate} className="generator-form">
          <div className="keyword-field" id="keyword-field" hidden={mode !== "keyword"}>
              <label htmlFor="keyword" id="keyword-label">{copy.keywordPrompt}</label>
              <div className="input-wrap">
                <input
                  id="keyword"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setError("");
                  }}
                  maxLength={48}
                  placeholder={copy.keywordPlaceholder}
                  autoComplete="off"
                />
                <span>{keyword.length}/48</span>
              </div>
          </div>

          <div
            ref={poemPaperRef}
            id="poem-paper"
            className={`poem-paper${haiku ? " has-illustration" : ""}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {haiku && <InkWashIllustration recipe={haiku.illustration} seed={haiku.seed} />}
            {haiku ? (
              <time className="paper-number paper-date" id="paper-date" dateTime={haiku.createdAt}>
                {haikuDateLabel(haiku.createdAt, displayed?.language ?? "en")}
              </time>
            ) : (
              <span className="paper-number paper-date" id="paper-date" aria-hidden="true">DATE —</span>
            )}
            <div className="sun-seal" aria-hidden="true">
              <span className="sun-seal-label">Haiku-<br />ly</span>
            </div>
            {haiku ? (
              <div
                className={poemLinesClassName(haiku.lines, displayed?.language ?? "en")}
                id="poem-lines"
                lang={languageTag(displayed?.language ?? "en")}
              >
                {haiku.lines.map((line, index) => (
                  <div className="poem-line" key={`${haiku.seed}-${index}`}>
                    <p>{line}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="poem-lines poem-empty" id="poem-lines">
                <p id="empty-poem">{copy.emptyPoem}</p>
              </div>
            )}
            <div className="paper-footer">
              <span>5 · 7 · 5</span>
              <button type="button" id="save-haiku" onClick={saveHaiku} aria-label={copy.saveAria} disabled={!haiku}>
                {saved ? copy.saved : copy.save}
              </button>
            </div>
          </div>

          <div className="action-row">
            <p className="error-message" id="error-message" role="alert">{error}</p>
            <button type="submit" className="generate-button" id="generate-haiku" disabled={isGenerating}>
              {isGenerating
                ? copy.generating
                : mode === "random" ? copy.generateRandom : copy.generateKeyword}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </section>

      <footer>
        <p>Pause. Notice. Begin again.</p>
        <div className="footer-meta">
          <span>Built for brief moments of attention.</span>
          <a
            className="footer-contact"
            href="mailto:zhiguoinusa@gmail.com"
            aria-label="Email Stillpoint at zhiguoinusa@gmail.com"
          >
            zhiguoinusa@gmail.com
          </a>
        </div>
      </footer>
    </main>
  );
}
