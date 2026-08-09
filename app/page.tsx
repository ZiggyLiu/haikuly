"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  estimateSyllables,
  makeKeywordHaiku,
  makeRandomHaiku,
  type Haiku,
  type Mode,
} from "./haiku";

export default function Home() {
  const [mode, setMode] = useState<Mode>("random");
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [haiku, setHaiku] = useState<Haiku>(() => makeRandomHaiku(Date.now()));

  const syllables = useMemo(
    () => haiku.lines.map((line) => estimateSyllables(line)),
    [haiku],
  );

  function generate(event?: FormEvent) {
    event?.preventDefault();
    const seed = Date.now() + Math.floor(Math.random() * 10000);
    setCopied(false);

    if (mode === "keyword") {
      if (!keyword.trim()) {
        setError("Enter a word or short phrase first.");
        return;
      }
      const next = makeKeywordHaiku(keyword, seed);
      if (!next) {
        setError("Try a shorter keyword or phrase, up to seven syllables.");
        return;
      }
      setHaiku(next);
    } else {
      setHaiku(makeRandomHaiku(seed));
    }
    setError("");
  }

  async function copyHaiku() {
    await navigator.clipboard.writeText(haiku.lines.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
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
                  placeholder="moonlight, first snow, home…"
                  autoComplete="off"
                />
                <span>{keyword.length}/48</span>
              </div>
            </div>
          )}

          <div className="poem-paper" aria-live="polite" aria-atomic="true">
            <span className="paper-number" aria-hidden="true">
              {String((haiku.seed % 99) + 1).padStart(2, "0")}
            </span>
            <div className="sun-seal" aria-hidden="true" />
            <div className="poem-lines">
              {haiku.lines.map((line, index) => (
                <div className="poem-line" key={`${haiku.seed}-${index}`}>
                  <p>{line}</p>
                  <span>{syllables[index]}</span>
                </div>
              ))}
            </div>
            <div className="paper-footer">
              <span>5 · 7 · 5</span>
              <button type="button" onClick={copyHaiku} aria-label="Copy haiku">
                {copied ? "Copied" : "Copy poem"}
              </button>
            </div>
          </div>

          <div className="action-row">
            <p className="error-message" role="alert">{error}</p>
            <button type="submit" className="generate-button">
              {mode === "random" ? "Find another" : "Write my haiku"}
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
