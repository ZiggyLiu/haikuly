import type { Language } from "../app/haiku";

const MAX_COMMENT_LENGTH = 1000;

type FeedbackPayload = {
  token?: unknown;
  rating?: unknown;
  comment?: unknown;
  poemDate?: unknown;
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function languageFrom(value: unknown): Language {
  return value === "zh" || value === "ja" ? value : "en";
}

export async function handleFeedback(request: Request, env: { DB: D1Database }): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }

  let body: FeedbackPayload;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse({ error: "Send a JSON object." }, 400);
    }
    body = parsed as FeedbackPayload;
  } catch {
    return jsonResponse({ error: "Send valid JSON." }, 400);
  }

  const token = typeof body.token === "string" ? body.token : "";
  const rating = typeof body.rating === "number" && Number.isInteger(body.rating) ? body.rating : 0;
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  const poemDate = typeof body.poemDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.poemDate)
    ? body.poemDate
    : null;

  if (!token || token.length > 512 || rating < 1 || rating > 5 || comment.length > MAX_COMMENT_LENGTH) {
    return jsonResponse({ error: "Provide a valid rating and a comment of 1000 characters or fewer." }, 400);
  }

  const subscriber = await env.DB.prepare(
    "SELECT id, language FROM subscription_members WHERE unsubscribe_token = ? AND status = 'active' LIMIT 1",
  ).bind(token).first<{ id: string; language: Language }>();

  if (!subscriber) return jsonResponse({ error: "This feedback link is no longer valid." }, 404);

  await env.DB.prepare(
    "INSERT INTO subscription_feedback (id, subscriber_id, poem_date, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), subscriber.id, poemDate, rating, comment || null, new Date().toISOString()).run();

  const messages: Record<Language, string> = {
    en: "Thank you for your feedback.",
    zh: "感谢你的反馈。",
    ja: "フィードバックありがとうございます。",
  };
  return jsonResponse({ message: messages[languageFrom(subscriber.language)] }, 201);
}
