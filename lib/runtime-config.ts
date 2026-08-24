export type SecretBindings = {
  DEEPSEEK_API_KEY?: string;
  RESEND_API_KEY?: string;
  TOKEN_ENCRYPTION_KEY?: string;
};

export type HaikulyRuntimeEnv = Env & SecretBindings;

export function requireSubscriptionConfig(runtimeEnv: HaikulyRuntimeEnv) {
  if (!runtimeEnv.DB) throw new Error("DB binding is unavailable.");
  if (!runtimeEnv.RESEND_API_KEY) throw new Error("RESEND_API_KEY is unavailable.");
  if (!runtimeEnv.TOKEN_ENCRYPTION_KEY) throw new Error("TOKEN_ENCRYPTION_KEY is unavailable.");
  if (!runtimeEnv.EMAIL_FROM) throw new Error("EMAIL_FROM is unavailable.");
  if (!runtimeEnv.EMAIL_REPLY_TO) throw new Error("EMAIL_REPLY_TO is unavailable.");
  if (!runtimeEnv.PUBLIC_BASE_URL) throw new Error("PUBLIC_BASE_URL is unavailable.");
  return {
    db: runtimeEnv.DB,
    resendApiKey: runtimeEnv.RESEND_API_KEY,
    tokenEncryptionKey: runtimeEnv.TOKEN_ENCRYPTION_KEY,
    emailFrom: runtimeEnv.EMAIL_FROM,
    emailReplyTo: runtimeEnv.EMAIL_REPLY_TO,
    publicBaseUrl: runtimeEnv.PUBLIC_BASE_URL,
    maxDailyConfirmations: boundedInteger(runtimeEnv.MAX_DAILY_CONFIRMATIONS, 10, 1, 25),
    maxDailyRecipients: boundedInteger(runtimeEnv.MAX_DAILY_RECIPIENTS, 90, 1, 100),
  };
}

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}
