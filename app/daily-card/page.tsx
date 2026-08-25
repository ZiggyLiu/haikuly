"use client";

import { useCallback, useEffect, useState } from "react";
import { haikuDateLabel, poemLinesClassName, type Haiku, type Language } from "../haiku";
import InkWashIllustration from "../ink-wash";

type DailyPoemResponse = { date: string; language: Language; poem: Haiku };

function languageTag(language: Language) {
  return language === "zh" ? "zh-CN" : language;
}

function DailyCard({ poem, language, onPainted }: { poem: Haiku; language: Language; onPainted: () => void }) {
  return (
    <div
      id="daily-poem-paper"
      className="poem-paper has-illustration daily-poem-paper"
      aria-label="Haiku-ly daily poem card"
    >
      <InkWashIllustration recipe={poem.illustration} seed={poem.seed} onPainted={onPainted} />
      <time className="paper-number paper-date" dateTime={poem.createdAt}>
        {haikuDateLabel(poem.createdAt, language)}
      </time>
      <div className="sun-seal" aria-hidden="true"><span className="sun-seal-label">https://<br />haikuly.fyi</span></div>
      <div className={poemLinesClassName(poem.lines, language)} lang={languageTag(language)}>
        {poem.lines.map((line, index) => <div className="poem-line" key={`${poem.seed}-${index}`}><p>{line}</p></div>)}
      </div>
      <div className="paper-footer">
        <span>{language === "zh" ? "三行 · 现代短俳" : language === "ja" ? "三行 · 現代短俳" : "Three lines · modern haiku"}</span>
      </div>
    </div>
  );
}

export default function DailyCardPage() {
  const [payload, setPayload] = useState<DailyPoemResponse | null>(null);
  const [request] = useState(() => {
    if (typeof window === "undefined") return { date: "", language: "", valid: false };
    const query = new URLSearchParams(window.location.search);
    const date = query.get("date") ?? "";
    const language = query.get("language") ?? "en";
    return { date, language, valid: /^\d{4}-\d{2}-\d{2}$/.test(date) && ["en", "zh", "ja"].includes(language) };
  });
  const [error, setError] = useState(() => !request.valid);
  const [ready, setReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const markPainted = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!request.valid) return;
    const { date, language } = request;
    fetch(`/api/daily-poem?date=${encodeURIComponent(date)}&language=${encodeURIComponent(language)}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("daily_poem_unavailable");
        return response.json() as Promise<DailyPoemResponse>;
      })
      .then((value) => setPayload(value))
      .catch(() => setError(true));
  }, [request]);

  useEffect(() => {
    if (!payload || !ready) return;
    if ("fonts" in document) void document.fonts.ready.then(() => setFontsReady(true));
    else void Promise.resolve().then(() => setFontsReady(true));
  }, [payload, ready]);

  return (
    <main className="daily-render-root" data-render-ready={payload && ready && fontsReady ? "true" : "false"}>
      {payload ? <DailyCard poem={payload.poem} language={payload.language} onPainted={markPainted} /> : (
        <p className="daily-render-status" role="status">{error ? "Daily poem unavailable" : "Loading daily poem…"}</p>
      )}
    </main>
  );
}
