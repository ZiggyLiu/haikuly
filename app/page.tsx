"use client";

import { FormEvent, useRef, useState } from "react";
import InkWashIllustration from "./ink-wash";
import {
  generationSourceLabel,
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

export default function Home() {
  const [mode, setMode] = useState<Mode>("random");
  const [language, setLanguage] = useState<Language>("en");
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const poemPaperRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState<{
    haiku: Haiku;
    source: GenerationSource;
    language: Language;
  } | null>(null);
  const haiku = displayed?.haiku ?? null;

  async function generate(event?: FormEvent) {
    event?.preventDefault();
    setSaved(false);

    if (mode === "keyword" && !keyword.trim()) {
      setError("Enter a word or short phrase first.");
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
        setError(result.error ?? "DeepSeek could not write a poem. Please try again.");
        return;
      }
      setDisplayed({ haiku: result.haiku, source: "deepseek", language: result.language ?? language });
    } catch {
      setError("DeepSeek could not be reached. Please try again.");
      return;
    } finally {
      setIsGenerating(false);
    }
    setError("");
  }

  function saveHaiku() {
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
          const text = label.classList.contains("poem-source")
            ? (label.textContent ?? "").toUpperCase()
            : label.textContent ?? "";
          context.fillText(text, position.x, position.y);
        });
      }

      context.strokeStyle = "rgba(54, 83, 71, 0.13)";
      context.lineWidth = 1;
      context.strokeRect(0.5, 0.5, width - 1, height - 1);

      const link = document.createElement("a");
      link.href = exportCanvas.toDataURL("image/png");
      link.download = haikuImageFilename(haiku.createdAt);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setError("The haiku image could not be saved. Please try again.");
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
    <main className="page-shell">
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
        <div className="mode-switch" role="group" aria-label="Generation mode">
          <button
            type="button"
            className={mode === "random" ? "active" : ""}
            aria-pressed={mode === "random"}
            onClick={() => changeMode("random")}
          >
            <span aria-hidden="true">✦</span> By chance
          </button>
          <button
            type="button"
            className={mode === "keyword" ? "active" : ""}
            aria-pressed={mode === "keyword"}
            onClick={() => changeMode("keyword")}
          >
            <span aria-hidden="true">⌁</span> From a word
          </button>
        </div>

        <div className="language-control">
          <span className="language-label">Poem language</span>
          <div className="language-switch" role="group" aria-label="Poem language">
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              aria-pressed={language === "en"}
              onClick={() => changeLanguage("en")}
            >
              English
            </button>
            <button
              type="button"
              className={language === "zh" ? "active" : ""}
              aria-pressed={language === "zh"}
              onClick={() => changeLanguage("zh")}
              lang="zh-CN"
            >
              中文
            </button>
          </div>
          <span className="language-rule">
            {language === "zh" ? "5 · 7 · 5 characters" : "5 · 7 · 5 syllables"}
          </span>
        </div>

        <form onSubmit={generate} className="generator-form">
          {mode === "keyword" && (
            <div className="keyword-field">
              <label htmlFor="keyword">What is on your mind?</label>
              <div className="input-wrap">
                <input
                  id="keyword"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setError("");
                  }}
                  maxLength={48}
                  placeholder={language === "zh" ? "月光，初雪，故乡…" : "moonlight, first snow, home…"}
                  autoComplete="off"
                />
                <span>{keyword.length}/48</span>
              </div>
              <p className="ai-note"><span aria-hidden="true">✦</span> Written, reviewed, and painted with DeepSeek</p>
            </div>
          )}

          <div
            ref={poemPaperRef}
            className={`poem-paper${haiku ? " has-illustration" : ""}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {haiku && <InkWashIllustration recipe={haiku.illustration} seed={haiku.seed} />}
            {haiku ? (
              <time className="paper-number paper-date" dateTime={haiku.createdAt}>
                {haikuDateLabel(haiku.createdAt, displayed?.language ?? "en")}
              </time>
            ) : (
              <span className="paper-number paper-date" aria-hidden="true">DATE —</span>
            )}
            <div className="sun-seal" aria-hidden="true" />
            {haiku ? (
              <div
                className={poemLinesClassName(haiku.lines, displayed?.language ?? "en")}
                lang={displayed?.language === "zh" ? "zh-CN" : "en"}
              >
                {haiku.lines.map((line, index) => (
                  <div className="poem-line" key={`${haiku.seed}-${index}`}>
                    <p>{line}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="poem-lines poem-empty">
                <p>Your next small moment will appear here.</p>
              </div>
            )}
            <div className="paper-footer">
              <span>5 · 7 · 5</span>
              <span className="poem-source">{haiku ? generationSourceLabel("deepseek") : "DeepSeek studio"}</span>
              <button type="button" onClick={saveHaiku} aria-label="Save haiku as a picture" disabled={!haiku}>
                {saved ? "Saved" : "Save Haiku"}
              </button>
            </div>
          </div>

          <div className="action-row">
            <p className="error-message" role="alert">{error}</p>
            <button type="submit" className="generate-button" disabled={isGenerating}>
              {isGenerating ? "Writing, reviewing, and painting…" : mode === "random" ? "Write a haiku" : "Write my haiku"}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </section>

      <footer>
        <p>Pause. Notice. Begin again.</p>
        <span>Built for brief moments of attention.</span>
      </footer>
    </main>
  );
}
