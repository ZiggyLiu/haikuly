"use client";

import { useState } from "react";
import type { FormEvent } from "react";

const COPY = {
  en: {
    title: "How was today’s Haiku-ly?",
    prompt: "Tell us what you thought of the poem.",
    rating: "Rating",
    comment: "Comment (optional)",
    placeholder: "A short note is welcome.",
    submit: "Send feedback",
    sending: "Sending…",
    success: "Thank you for your feedback.",
    invalid: "This feedback link is no longer valid.",
    error: "Please choose a rating and try again.",
  },
  zh: {
    title: "你觉得今天的 Haiku-ly 怎么样？",
    prompt: "告诉我们你对这首俳句的感受。",
    rating: "评分",
    comment: "留言（可选）",
    placeholder: "欢迎写下几句简短的话。",
    submit: "提交反馈",
    sending: "提交中…",
    success: "感谢你的反馈。",
    invalid: "此反馈链接已失效。",
    error: "请选择评分后重试。",
  },
  ja: {
    title: "今日の Haiku-ly はいかがでしたか？",
    prompt: "俳句についての感想をお聞かせください。",
    rating: "評価",
    comment: "コメント（任意）",
    placeholder: "短いメモをどうぞ。",
    submit: "フィードバックを送る",
    sending: "送信中…",
    success: "フィードバックありがとうございます。",
    invalid: "このフィードバックリンクは無効です。",
    error: "評価を選んでもう一度お試しください。",
  },
} as const;

type Language = keyof typeof COPY;

export default function FeedbackPage() {
  const params = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const language = (params?.get("lang") === "zh" || params?.get("lang") === "ja" ? params.get("lang") : "en") as Language;
  const token = params?.get("token") ?? "";
  const copy = COPY[language];
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating || sending) {
      setStatus(copy.error);
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, comment }),
      });
      const body = await response.json() as { message?: string; error?: string };
      setStatus(response.ok ? body.message ?? copy.success : body.error ?? copy.invalid);
      if (response.ok) {
        setRating(0);
        setComment("");
      }
    } catch {
      setStatus(copy.invalid);
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f4f0e6", color: "#273a33", padding: "48px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", background: "#faf7ef", border: "1px solid #d7d0c0", padding: "36px 28px" }}>
        <p style={{ margin: "0 0 24px", color: "#6d7b74", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase" }}>Haiku-ly</p>
        <h1 style={{ margin: "0 0 12px", fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 400 }}>{copy.title}</h1>
        <p style={{ margin: "0 0 28px", lineHeight: 1.7 }}>{copy.prompt}</p>
        <form onSubmit={submit}>
          <fieldset style={{ border: 0, padding: 0, margin: "0 0 24px" }}>
            <legend style={{ marginBottom: 10 }}>{copy.rating}</legend>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" aria-label={String(value)} onClick={() => setRating(value)}
                  style={{ border: "1px solid #365347", background: value <= rating ? "#365347" : "transparent", color: value <= rating ? "#fff" : "#365347", borderRadius: 4, width: 42, height: 38, cursor: "pointer" }}>
                  {value}
                </button>
              ))}
            </div>
          </fieldset>
          <label style={{ display: "block", marginBottom: 10 }} htmlFor="feedback-comment">{copy.comment}</label>
          <textarea id="feedback-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000}
            placeholder={copy.placeholder} rows={5} style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 12, border: "1px solid #c9c1b0", background: "#fffdf7", color: "#273a33", resize: "vertical", marginBottom: 20 }} />
          <button type="submit" disabled={sending} style={{ border: 0, background: "#365347", color: "#fff", padding: "13px 20px", cursor: sending ? "wait" : "pointer" }}>
            {sending ? copy.sending : copy.submit}
          </button>
          {status ? <p role="status" style={{ margin: "18px 0 0", lineHeight: 1.6 }}>{status}</p> : null}
        </form>
      </div>
    </main>
  );
}
