export type ResendEmail = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
  headers?: Record<string, string>;
};

export class ResendError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(`Resend request failed with status ${status}.`);
    this.name = "ResendError";
    this.status = status;
    this.code = code;
  }
}

async function sendRequest(
  path: "/emails" | "/emails/batch",
  apiKey: string,
  payload: ResendEmail | ResendEmail[],
  idempotencyKey: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`https://api.resend.com${path}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let code = "resend_error";
      try {
        const body: unknown = await response.json();
        if (body && typeof body === "object" && !Array.isArray(body)) {
          const candidate = (body as { name?: unknown }).name;
          if (typeof candidate === "string" && candidate.length <= 80) code = candidate;
        }
      } catch {
        // Keep the stable error code when Resend does not return JSON.
      }
      throw new ResendError(response.status, code);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ResendError) throw error;
    throw new ResendError(503, error instanceof DOMException && error.name === "AbortError" ? "timeout" : "network_error");
  } finally {
    clearTimeout(timeout);
  }
}

export function sendResendEmail(
  apiKey: string,
  email: ResendEmail,
  idempotencyKey: string,
) {
  return sendRequest("/emails", apiKey, email, idempotencyKey);
}

export function sendResendBatch(
  apiKey: string,
  emails: ResendEmail[],
  idempotencyKey: string,
) {
  if (emails.length < 1 || emails.length > 100) {
    throw new Error("A Resend batch must contain between 1 and 100 emails.");
  }
  return sendRequest("/emails/batch", apiKey, emails, idempotencyKey);
}
