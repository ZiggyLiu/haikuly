"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  countPoeticUnits,
  generationSourceLabel,
  poemLinesClassName,
  type GenerationSource,
  type Haiku,
  type Language,
  type Mode,
} from "./haiku";

export default function Home() {
  const [mode, setMode] = useState<Mode>("random");
  const [language, setLanguage] = useState<Language>("en");
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [displayed, setDisplayed] = useState<{
    haiku: Haiku;
    source: GenerationSource;
    language: Language;
  } | null>(null);
  const haiku = displayed?.haiku ?? null;

  const lineCounts = useMemo(
    () => displayed?.haiku.lines.map((line) => countPoeticUnits(line, displayed.language)) ?? [],
    [displayed],
  );

  async function generate(event?: FormEvent) {
    event?.preventDefault();
    setCopied(false);

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

  async function copyHaiku() {
    if (!haiku) return;
    await navigator.clipboard.writeText(haiku.lines.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setCopied(false);
  }

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setError("");
    setCopied(false);
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
          Find a poem by chance, or begin with a word that is already on your mind.
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
              <p className="ai-note"><span aria-hidden="true">✦</span> Written and reviewed by DeepSeek</p>
            </div>
          )}

          <div className="poem-paper" aria-live="polite" aria-atomic="true">
            <span className="paper-number" aria-hidden="true">
              {haiku ? String((haiku.seed % 99) + 1).padStart(2, "0") : "—"}
            </span>
            <div className="sun-seal" aria-hidden="true" />
            {haiku ? (
              <div
                className={poemLinesClassName(haiku.lines, displayed?.language ?? "en")}
                lang={displayed?.language === "zh" ? "zh-CN" : "en"}
              >
                {haiku.lines.map((line, index) => (
                  <div className="poem-line" key={`${haiku.seed}-${index}`}>
                    <p>{line}</p>
                    <span title={displayed?.language === "zh" ? "characters" : "syllables"}>{lineCounts[index]}</span>
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
              <button type="button" onClick={copyHaiku} aria-label="Copy haiku" disabled={!haiku}>
                {copied ? "Copied" : "Copy poem"}
              </button>
            </div>
          </div>

          <div className="action-row">
            <p className="error-message" role="alert">{error}</p>
            <button type="submit" className="generate-button" disabled={isGenerating}>
              {isGenerating ? "Writing and reviewing…" : mode === "random" ? "Write a haiku" : "Write my haiku"}
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
